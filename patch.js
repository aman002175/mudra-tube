const fs = require('fs');
let code = fs.readFileSync('src/app/api/sync/route.ts', 'utf8');

// We will add a global error tracker
code = code.replace(
  `async function getLiveStore(): Promise<LiveStore> {`,
  `declare global { var __firebase_pull_error: any; }\n\nasync function getLiveStore(): Promise<LiveStore> {`
);

// We will change getLiveStore to capture error if pullFromFirestore fails, wait pullFromFirestore returns null on error. 
// We need to modify pullFromFirestore in src/lib/db.ts to surface the error!
