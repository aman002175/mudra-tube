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
import { doc, setDoc } from "firebase/firestore";

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

function getStoragePath(): string {
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, ".test"), "ok");
    fs.unlinkSync(path.join(dir, ".test"));
    return LOCAL_DB_PATH;
  } catch (e) {
    return TMP_DB_PATH;
  }
}

declare global {
  var __mudratube_db_state: DatabaseState | undefined;
}

function getDefaultState(): DatabaseState {
  return {
    users: {},
    withdrawals: [],
    promotions: [],
    supportMessages: [],
    tasks: [...initialTasks],
    paymentMethods: [...initialPaymentMethods],
    packages: [...initialPackages],
    config: { ...initialConfig },
  };
}

/**
 * Load database state from disk or initialize with defaults
 */
export function loadDatabase(): DatabaseState {
  if (global.__mudratube_db_state) {
    return global.__mudratube_db_state;
  }

  const paths = [getStoragePath(), TMP_DB_PATH, LOCAL_DB_PATH];
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          global.__mudratube_db_state = {
            users: parsed.users || {},
            withdrawals: parsed.withdrawals || [],
            promotions: parsed.promotions || [],
            supportMessages: parsed.supportMessages || [],
            tasks: parsed.tasks?.length > 0 ? parsed.tasks : [...initialTasks],
            paymentMethods: parsed.paymentMethods?.length > 0 ? parsed.paymentMethods : [...initialPaymentMethods],
            packages: parsed.packages?.length > 0 ? parsed.packages : [...initialPackages],
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
 * Save database state to disk synchronously and trigger async cloud backup
 */
export function saveDatabase(state: DatabaseState): void {
  global.__mudratube_db_state = state;

  const dataString = JSON.stringify(state, null, 2);
  const targetPath = getStoragePath();

  try {
    fs.writeFileSync(targetPath, dataString, "utf-8");
  } catch (err) {
    try {
      fs.writeFileSync(TMP_DB_PATH, dataString, "utf-8");
    } catch (e2) {
      console.error("Critical: Failed to save database to disk:", e2);
    }
  }

  // If Firebase Firestore is configured, sync in background
  if (isFirebaseConfigured) {
    syncToFirestore(state).catch((err) => {
      console.warn("Firestore background sync warning:", err);
    });
  }
}

/**
 * Sync entire state or changes to Firebase Firestore
 */
async function syncToFirestore(state: DatabaseState): Promise<void> {
  try {
    // 1. Sync Config
    await setDoc(doc(db, "global_config", "platform_settings"), state.config, { merge: true });

    // 2. Sync Users
    for (const [userId, user] of Object.entries(state.users)) {
      await setDoc(doc(db, "users", userId), user, { merge: true });
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
