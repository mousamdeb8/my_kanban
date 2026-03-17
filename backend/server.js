require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const { sequelize } = require("./models");

const projectRoutes      = require("./routes/projectRoutes");
const taskRoutes         = require("./routes/taskRoutes");
const userRoutes         = require("./routes/userRoutes");
const authRoutes         = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");


const app  = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/projects",      projectRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/auth",          authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/gamification",  gamificationRoutes);


app.get("/", (req, res) => res.send("Backend is running"));

// Use force:false, alter:false — tables already exist in Aiven, no need to modify
sequelize.sync({ force: false, alter: false }).then(async () => {
  console.log("✅ DB connected");

  // Sync roles quietly
  try {
    const { AuthUser, User } = require("./models");
    const authUsers = await AuthUser.findAll({ attributes: ["id","email","role"] });
    for (const au of authUsers) {
      const freshRole = (au.role || "member").toLowerCase();
      await User.update({ role: freshRole }, { where: { email: au.email } });
    }
    console.log("✅ Roles synced");
  } catch (e) {
    console.warn("Role sync warning:", e.message);
  }

  app.listen(PORT, () => console.log("✅ Server running on port " + PORT));
}).catch(err => {
  console.error("❌ DB connection failed:", err.message);
  // Start server anyway so health checks pass
  app.listen(PORT, () => console.log("⚠️ Server running WITHOUT DB on port " + PORT));
});