// Run ONCE: node backend/migrateTasksAndNotifications.js
const { sequelize } = require("./models");

sequelize.sync().then(async () => {

  // 1. Add 'type' column to tasks
  try {
    await sequelize.query("ALTER TABLE tasks ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'task'");
    console.log("✅ tasks.type added");
  } catch(e) {
    if (e.message.includes("Duplicate column")) console.log("ℹ️  tasks.type already exists");
    else console.error("tasks.type error:", e.message);
  }

  // 2. Add 'assigned_by' column to tasks
  try {
    await sequelize.query("ALTER TABLE tasks ADD COLUMN assigned_by INT NULL");
    console.log("✅ tasks.assigned_by added");
  } catch(e) {
    if (e.message.includes("Duplicate column")) console.log("ℹ️  tasks.assigned_by already exists");
    else console.error("tasks.assigned_by error:", e.message);
  }

  // 3. Create notifications table
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        userId      INT NOT NULL,
        type        VARCHAR(30) NOT NULL DEFAULT 'info',
        message     VARCHAR(255) NOT NULL,
        sub         VARCHAR(255),
        taskId      INT,
        projectId   INT,
        isRead      TINYINT(1) NOT NULL DEFAULT 0,
        createdAt   DATETIME NOT NULL DEFAULT NOW(),
        updatedAt   DATETIME NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ notifications table created");
  } catch(e) {
    console.error("notifications table error:", e.message);
  }

  console.log("\n✅ Migration complete. Restart backend.");
  process.exit(0);
});