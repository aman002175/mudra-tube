const fs = require('fs');
let code = fs.readFileSync('src/app/api/sync/route.ts', 'utf8');

// Replace the bad logic
code = code.replace(
  /if \(!uid\.startsWith\("demo_"\) && !\(u\.username \|\| ""\)\.startsWith\("viewer_"\) \|\| \(u\.username \|\| ""\)\.startsWith\("browser_"\) \|\| \(u\.username \|\| ""\)\.startsWith\("@browser_"\) \|\| uid\.startsWith\("browser_"\)\) {/,
  `if (!uid.startsWith("demo_") && !uid.startsWith("browser_") && !/(^viewer_|^browser_|^@browser_)/i.test(u.username || "")) {`
);

code = code.replace(
  /const allUsers = Array\.from\(store\.users\.values\(\)\)\.filter\(u => !u\.user_id\.startsWith\("demo_"\) && !\(u\.username \|\| ""\)\.startsWith\("viewer_"\) \|\| \(u\.username \|\| ""\)\.startsWith\("browser_"\) \|\| \(u\.username \|\| ""\)\.startsWith\("@browser_"\) \|\| uid\.startsWith\("browser_"\)\);/,
  `const allUsers = Array.from(store.users.values()).filter(u => !u.user_id.startsWith("demo_") && !u.user_id.startsWith("browser_") && !/(^viewer_|^browser_|^@browser_)/i.test(u.username || ""));`
);

fs.writeFileSync('src/app/api/sync/route.ts', code);
