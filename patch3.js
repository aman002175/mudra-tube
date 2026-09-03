const fs = require('fs');
let code = fs.readFileSync('src/app/api/sync/route.ts', 'utf8');

code = code.replace(
  `function persistStore(store: LiveStore): void {`,
  `async function persistStore(store: LiveStore): Promise<void> {`
);

code = code.replace(
  `  saveDatabase({`,
  `  await saveDatabase({`
);

// We need to replace all `persistStore(store);` with `await persistStore(store);`
code = code.replace(/persistStore\(store\);/g, `await persistStore(store);`);

fs.writeFileSync('src/app/api/sync/route.ts', code);
