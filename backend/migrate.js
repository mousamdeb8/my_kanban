/// Run: node backend/migrate.js
require("dotenv").config();
const { sequelize } = require("./models");

async function migrate() {
  try {
    await sequelize.sync();

    // 1. Add isActive to auth_users
    try {
      await sequelize.query("ALTER TABLE auth_users ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1");
      console.log("✅ isActive column added");
    } catch (e) {
      if (e.message.includes("Duplicate column")) console.log("ℹ️  isActive already exists");
      else throw e;
    }

    // 2. Set all existing users to active
    await sequelize.query("UPDATE auth_users SET isActive = 1");
    console.log("✅ All auth_users set to active");

    // 3. Drop the unique constraint on users.email
    //    (same person can be on multiple projects)
    try {
      await sequelize.query("ALTER TABLE users DROP INDEX email");
      console.log("✅ Dropped unique constraint on users.email");
    } catch (e) {
      if (e.message.includes("check that column/key exists")) {
        console.log("ℹ️  No unique index on users.email — already fine");
      } else {
        console.log("ℹ️  users.email index:", e.message);
      }
    }

    // 4. Show final state
    const [authUsers] = await sequelize.query(
      "SELECT id, name, email, role, isActive FROM auth_users ORDER BY id"
    );
    console.log("\n── auth_users ──");
    console.table(authUsers);

    const [users] = await sequelize.query(
      "SELECT id, name, email, project_id FROM users ORDER BY id"
    );
    console.log("\n── users ──");
    console.table(users);

    console.log("\n✅ Migration complete! Restart your backend now.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();