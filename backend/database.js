// backend/database.js
const { Sequelize } = require("sequelize");

// Create Sequelize instance
const sequelize = new Sequelize("kanban_db", "root", "mousamdeb8", {
  host: "localhost",
  dialect: "mysql",
  logging: true, // Shows SQL queries in terminal
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL Connected!");
    
    // Sync tables (update columns if needed, without dropping data)
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced with MySQL");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

connectDB();

module.exports = sequelize;
