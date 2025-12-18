const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Test root
app.get("/", (req, res) => res.send("Backend is running"));

// Sync database and start server
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
