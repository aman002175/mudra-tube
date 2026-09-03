import fs from "fs";
import path from "path";
import {
  UserProfile,
  WithdrawalRequest,
  PromotionRequest,
  SupportChatMessage,
  ChannelTask,
  GlobalConfig,
  AdminPaymentMethod,
  PromoPackage,
} from "@/types";
import {
  initialConfig,
  initialPackages,
  initialPaymentMethods,
  initialTasks,
} from "@/lib/mockData";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

export interface DatabaseState {
  users: Record<string, UserProfile>;
  withdrawals: WithdrawalRequest[];
  promotions: PromotionRequest[];
  supportMessages: SupportChatMessage[];
  tasks: ChannelTask[];
  paymentMethods: AdminPaymentMethod[];
  packages: PromoPackage[];
  config: GlobalConfig;
}

// Database file paths
const LOCAL_DB_PATH = path.join(process.cwd(), "data", "database.json");
const TMP_DB_PATH = path.join("/tmp", "mudratube_db.json");

// Resolve storage path once at boot to eliminate concurrent unlink race conditions
let RESOLVED_STORAGE_PATH: string = LOCAL_DB_PATH;
try {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  RESOLVED_STORAGE_PATH = LOCAL_DB_PATH;
} catch {
  RESOLVED_STORAGE_PATH = TMP_DB_PATH;
}

declare global {
  var __firebase_pull_error: any;
  var __mudratube_db_state: DatabaseState | undefined;
}

function getDefaultState(): DatabaseState {
  return {
    users: {},
    withdrawals: [],
    promotions: [],
    supportMessages: [],
    tasks: JSON.parse(JSON.stringify(initialTasks)),
    paymentMethods: JSON.parse(JSON.stringify(initialPaymentMethods)),
    packages: JSON.parse(JSON.stringify(initialPackages)),
    config: { ...initialConfig },
  };
}

/**
 * Load database state from disk or backup with defaults
 */
export function loadDatabase(): DatabaseState {
  if (global.__mudratube_db_state) {
    return global.__mudratube_db_state;
  }

  const paths = [
    RESOLVED_STORAGE_PATH,
    `${RESOLVED_STORAGE_PATH}.bak`,
    TMP_DB_PATH,
    `${TMP_DB_PATH}.bak`,
    LOCAL_DB_PATH,
  ];

  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          global.__mudratube_db_state = {
            users: parsed.users || {},
            withdrawals: parsed.withdrawals || [],
            promotions: parsed.promotions || [],
            supportMessages: parsed.supportMessages || [],
            tasks: parsed.tasks?.length > 0 ? parsed.tasks : JSON.parse(JSON.stringify(initialTasks)),
            paymentMethods: parsed.paymentMethods?.length > 0 ? parsed.paymentMethods : JSON.parse(JSON.stringify(initialPaymentMethods)),
            packages: parsed.packages?.length > 0 ? parsed.packages : JSON.parse(JSON.stringify(initialPackages)),
            config: { ...initialConfig, ...(parsed.config || {}) },
          };
          return global.__mudratube_db_state;
        }
      }
    } catch (e) {
      console.warn(`Could not read database from ${filePath}:`, e);
    }
  }

  const defaultState = getDefaultState();
  global.__mudratube_db_state = defaultState;
  saveDatabase(defaultState);
  return defaultState;
}

/**
 * Save database state to disk atomically (.tmp -> rename) with .bak safeguard
 */
export async function saveDatabase(state: DatabaseState): Promise<void> {
  global.__mudratube_db_state = state;

  const dataString = JSON.stringify(state, null, 2);
  const targetPath = RESOLVED_STORAGE_PATH;
  const tmpPath = `${targetPath}.tmp`;
  const bakPath = `${targetPath}.bak`;

  try {
    fs.writeFileSync(tmpPath, dataString, "utf-8");
    if (fs.existsSync(targetPath)) {
      try {
        fs.copyFileSync(targetPath, bakPath);
      } catch {}
    }
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try {
      const tmpBackup = `${TMP_DB_PATH}.tmp`;
      fs.writeFileSync(tmpBackup, dataString, "utf-8");
      fs.renameSync(tmpBackup, TMP_DB_PATH);
    } catch (e2) {
      console.error("Critical: Failed to save database to disk:", e2);
    }
  }

  // If Firebase Firestore is configured, sync in background
  if (isFirebaseConfigured) {
    await syncToFirestore(state).catch((err) => {
      console.warn("Firestore background sync warning:", err);
    });
  }
}

export const lastSyncedStateHash = new Map<string, string>();

/**
 * Sync entire state or changes to Firebase Firestore
 */
async function syncToFirestore(state: DatabaseState): Promise<void> {
  try {
    const syncDoc = async (collectionName: string, id: string, data: any) => {
      if (!id) return;
      const key = `${collectionName}/${id}`;
      const dataHash = JSON.stringify(data);
      if (lastSyncedStateHash.get(key) === dataHash) return; // Skip if no change
      
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      lastSyncedStateHash.set(key, dataHash);
    };

    // 1. Sync Config
    await syncDoc("global_config", "platform_settings", state.config);

    // 2. Sync Users
    for (const [userId, user] of Object.entries(state.users)) {
      await syncDoc("users", userId, user);
    }

    // 3. Sync Tasks
    for (const task of (state.tasks || [])) {
      await syncDoc("tasks", task.id, task);
    }

    // 4. Sync Packages
    for (const pkg of (state.packages || [])) {
      await syncDoc("packages", pkg.id, pkg);
    }

    // 5. Sync Payment Methods
    for (const pm of (state.paymentMethods || [])) {
      await syncDoc("paymentMethods", pm.id, pm);
    }

    // 6. Sync Withdrawals
    for (const wd of (state.withdrawals || [])) {
      await syncDoc("withdrawals", wd.id, wd);
    }

    // 7. Sync Promotions
    for (const promo of (state.promotions || [])) {
      await syncDoc("promotions", promo.id, promo);
    }

    // 8. Sync Support Messages
    for (const msg of (state.supportMessages || [])) {
      await syncDoc("supportMessages", msg.id, msg);
    }
  } catch (err) {
    console.error("Firestore sync error:", err);
  }
}

/**
 * High-level Database Operations
 */

export function getAllUsers(): UserProfile[] {
  const dbState = loadDatabase();
  return Object.values(dbState.users);
}

export function getUserById(userId: string): UserProfile | null {
  const dbState = loadDatabase();
  return dbState.users[userId] || null;
}

export function saveUser(user: UserProfile): UserProfile {
  const dbState = loadDatabase();
  dbState.users[user.user_id] = user;
  saveDatabase(dbState);
  return user;
}

export function getGlobalConfig(): GlobalConfig {
  const dbState = loadDatabase();
  return dbState.config;
}

export function updateGlobalConfig(partialConfig: Partial<GlobalConfig>): GlobalConfig {
  const dbState = loadDatabase();
  dbState.config = {
    ...dbState.config,
    ...partialConfig,
  };
  saveDatabase(dbState);
  return dbState.config;
}

export function getPaymentMethods(): AdminPaymentMethod[] {
  const dbState = loadDatabase();
  return dbState.paymentMethods;
}

export function updatePaymentMethods(methods: AdminPaymentMethod[]): AdminPaymentMethod[] {
  const dbState = loadDatabase();
  dbState.paymentMethods = methods;
  saveDatabase(dbState);
  return dbState.paymentMethods;
}

export function getChannelTasks(): ChannelTask[] {
  const dbState = loadDatabase();
  return dbState.tasks;
}

export function updateChannelTasks(tasks: ChannelTask[]): ChannelTask[] {
  const dbState = loadDatabase();
  dbState.tasks = tasks;
  saveDatabase(dbState);
  return dbState.tasks;
}

export function getAdPackages(): PromoPackage[] {
  const dbState = loadDatabase();
  return dbState.packages;
}

export function updateAdPackages(packages: PromoPackage[]): PromoPackage[] {
  const dbState = loadDatabase();
  dbState.packages = packages;
  saveDatabase(dbState);
  return dbState.packages;
}

export function getWithdrawals(): WithdrawalRequest[] {
  const dbState = loadDatabase();
  return dbState.withdrawals;
}

export function addWithdrawal(wd: WithdrawalRequest): WithdrawalRequest {
  const dbState = loadDatabase();
  dbState.withdrawals.unshift(wd);
  saveDatabase(dbState);
  return wd;
}

export function updateWithdrawal(id: string, updates: Partial<WithdrawalRequest>): WithdrawalRequest | null {
  const dbState = loadDatabase();
  const idx = dbState.withdrawals.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  dbState.withdrawals[idx] = { ...dbState.withdrawals[idx], ...updates };
  saveDatabase(dbState);
  return dbState.withdrawals[idx];
}

export function getPromotions(): PromotionRequest[] {
  const dbState = loadDatabase();
  return dbState.promotions;
}

export function addPromotion(promo: PromotionRequest): PromotionRequest {
  const dbState = loadDatabase();
  dbState.promotions.unshift(promo);
  saveDatabase(dbState);
  return promo;
}

export function updatePromotion(id: string, updates: Partial<PromotionRequest>): PromotionRequest | null {
  const dbState = loadDatabase();
  const idx = dbState.promotions.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  dbState.promotions[idx] = { ...dbState.promotions[idx], ...updates };
  saveDatabase(dbState);
  return dbState.promotions[idx];
}

export function getSupportMessages(): SupportChatMessage[] {
  const dbState = loadDatabase();
  return dbState.supportMessages;
}

export function addSupportMessage(msg: SupportChatMessage): SupportChatMessage {
  const dbState = loadDatabase();
  dbState.supportMessages.push(msg);
  saveDatabase(dbState);
  return msg;
}

export async function pullFromFirestore(): Promise<DatabaseState | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const state = getDefaultState();
    
    // 1. Config
    const configSnap = await getDoc(doc(db, "global_config", "platform_settings"));
    if (configSnap.exists()) {
      state.config = { ...state.config, ...configSnap.data() };
      lastSyncedStateHash.set("global_config/platform_settings", JSON.stringify(state.config));
    }

    // Generic fetch helper
    const fetchColl = async (collName: string, idField: string) => {
      const snap = await getDocs(collection(db, collName));
      return snap.docs.map(d => {
        const data = d.data();
        if (data[idField]) lastSyncedStateHash.set(collName + "/" + data[idField], JSON.stringify(data));
        return data;
      });
    };

    // 2. Users
    const usersList = await fetchColl("users", "user_id");
    usersList.forEach(u => { state.users[u.user_id] = u as any; });

    // 3. Tasks
    const tasks = await fetchColl("tasks", "id");
    if (tasks.length > 0) state.tasks = tasks as any;

    // 4. Packages
    const pkgs = await fetchColl("packages", "id");
    if (pkgs.length > 0) state.packages = pkgs as any;

    // 5. Payment Methods
    const pms = await fetchColl("paymentMethods", "id");
    if (pms.length > 0) state.paymentMethods = pms as any;

    // 6. Withdrawals
    const wds = await fetchColl("withdrawals", "id");
    if (wds.length > 0) state.withdrawals = wds as any;

    // 7. Promotions
    const promos = await fetchColl("promotions", "id");
    if (promos.length > 0) state.promotions = promos as any;

    // 8. Support Messages
    const msgs = await fetchColl("supportMessages", "id");
    if (msgs.length > 0) state.supportMessages = msgs as any;

    return state;
  } catch (err) {
    console.error("Firebase pull error:", err); global.__firebase_pull_error = (err as any)?.message || String(err);
    return null;
  }
}
