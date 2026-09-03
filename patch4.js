const fs = require('fs');
let code = fs.readFileSync('src/app/api/sync/route.ts', 'utf8');

// 1. Prevent duplicate task creation
code = code.replace(
  `        const taskId = \`task_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`;`,
  `        const existingTask = store.tasks.find(t => t.promo_id === promo.id);
        if (existingTask) {
          promo.status = "approved";
          promo.task_id = existingTask.id;
          await persistStore(store);
          return NextResponse.json({ success: true, task: existingTask, promotion: promo });
        }
        
        const taskId = \`task_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`;`
);

// 2. Add cleanup script to getLiveStore
code = code.replace(
  `    const userMap = new Map<string, UserProfile>();
    for (const [uid, u] of Object.entries(dbState.users || {})) {
      if (!uid.startsWith("demo_")) { userMap.set(uid, u); }
    }`,
  `    const userMap = new Map<string, UserProfile>();
    for (const [uid, u] of Object.entries(dbState.users || {})) {
      if (!uid.startsWith("demo_") && !(u.username || "").startsWith("viewer_")) {
        userMap.set(uid, u);
      }
    }
    
    // Deduplicate tasks (keep the one with highest joined_count or the oldest)
    const uniqueTasks = new Map();
    const cleanTasks = [];
    for (const t of (dbState.tasks || [])) {
      if (t.promo_id) {
        if (!uniqueTasks.has(t.promo_id)) {
          uniqueTasks.set(t.promo_id, t);
          cleanTasks.push(t);
        } else {
          // Merge joined_count
          const existing = uniqueTasks.get(t.promo_id);
          existing.joined_count = Math.max(existing.joined_count, t.joined_count || 0);
        }
      } else {
        cleanTasks.push(t);
      }
    }
    dbState.tasks = cleanTasks;`
);

// Also filter in the GET /api/sync endpoint for safety
code = code.replace(
  `const allUsers = Array.from(store.users.values());`,
  `const allUsers = Array.from(store.users.values()).filter(u => !u.user_id.startsWith("demo_") && !(u.username || "").startsWith("viewer_"));`
);

fs.writeFileSync('src/app/api/sync/route.ts', code);
