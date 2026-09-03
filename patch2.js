const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

// 1. Export lastSyncedStateHash so it can be populated
code = code.replace(
  `const lastSyncedStateHash = new Map<string, string>();`,
  `export const lastSyncedStateHash = new Map<string, string>();`
);

// 2. Change saveDatabase to return Promise<void>
code = code.replace(
  `export function saveDatabase(state: DatabaseState): void {`,
  `export async function saveDatabase(state: DatabaseState): Promise<void> {`
);

// 3. Await syncToFirestore
code = code.replace(
  `  if (isFirebaseConfigured) {
    syncToFirestore(state).catch((err) => {
      console.warn("Firestore background sync warning:", err);
    });
  }`,
  `  if (isFirebaseConfigured) {
    await syncToFirestore(state).catch((err) => {
      console.warn("Firestore background sync warning:", err);
    });
  }`
);

// 4. Update pullFromFirestore to populate the hash
code = code.replace(
  `    const configSnap = await getDoc(doc(db, "global_config", "platform_settings"));
    if (configSnap.exists()) {
      state.config = { ...state.config, ...configSnap.data() };
    }`,
  `    const configSnap = await getDoc(doc(db, "global_config", "platform_settings"));
    if (configSnap.exists()) {
      state.config = { ...state.config, ...configSnap.data() };
      lastSyncedStateHash.set("global_config/platform_settings", JSON.stringify(state.config));
    }`
);

code = code.replace(
  `    const fetchColl = async (collName: string) => {
      const snap = await getDocs(collection(db, collName));
      return snap.docs.map(d => d.data());
    };`,
  `    const fetchColl = async (collName: string, idField: string) => {
      const snap = await getDocs(collection(db, collName));
      return snap.docs.map(d => {
        const data = d.data();
        if (data[idField]) lastSyncedStateHash.set(collName + "/" + data[idField], JSON.stringify(data));
        return data;
      });
    };`
);

code = code.replace(`fetchColl("users")`, `fetchColl("users", "user_id")`);
code = code.replace(`fetchColl("tasks")`, `fetchColl("tasks", "id")`);
code = code.replace(`fetchColl("packages")`, `fetchColl("packages", "id")`);
code = code.replace(`fetchColl("paymentMethods")`, `fetchColl("paymentMethods", "id")`);
code = code.replace(`fetchColl("withdrawals")`, `fetchColl("withdrawals", "id")`);
code = code.replace(`fetchColl("promotions")`, `fetchColl("promotions", "id")`);
code = code.replace(`fetchColl("supportMessages")`, `fetchColl("supportMessages", "id")`);

fs.writeFileSync('src/lib/db.ts', code);
