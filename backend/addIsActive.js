// Run this ONCE: node backend/addIsActive.js
const { sequelize } = require("./models");

sequelize.sync().then(async () => {
  try {
    await sequelize.query("ALTER TABLE auth_users ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1");
    console.log("✅ isActive column added to auth_users");
  } catch (e) {
    if (e.message.includes("Duplicate column")) {
      console.log("ℹ️  isActive column already exists — skipping");
    } else {
      console.error("❌ Error:", e.message);
    }
  }

  // Set all existing users to active
  await sequelize.query("UPDATE auth_users SET isActive = 1 WHERE isActive IS NULL");
  console.log("✅ All existing users set to active");

  const [users] = await sequelize.query("SELECT id, name, email, isActive FROM auth_users ORDER BY id");
  console.log("\n── auth_users after migration ──");
  console.table(users);
  process.exit(0);
});