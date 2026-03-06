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

const app  = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/projects",      projectRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/auth",          authRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => res.send("Backend is running"));

sequelize.sync({ alter: false }).then(async () => {
  console.log("✅ DB synced");

  // Startup: sync ALL roles from auth_users -> users (auth_users is source of truth)
  try {
    const { AuthUser, User } = require("./models");
    const authUsers = await AuthUser.findAll({ attributes: ["id","email","role"] });
    let synced = 0;
    for (const au of authUsers) {
      const freshRole = (au.role || "member").toLowerCase();
      const rows = await User.findAll({ where: { email: au.email } });
      for (const u of rows) {
        if ((u.role || "").toLowerCase() !== freshRole) {
          await u.update({ role: freshRole });
          synced++;
          console.log("  Synced " + au.email + ": " + u.role + " -> " + freshRole);
        }
      }
    }
    console.log(synced === 0 ? "  All roles in sync" : "  Synced " + synced + " role(s)");
  } catch (e) {
    console.warn("  Role sync warning:", e.message);
  }

  app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
});