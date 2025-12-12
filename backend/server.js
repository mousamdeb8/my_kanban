// backend/server.js
require("./models/Task");
const express = require("express");
const cors = require("cors");
const taskRoutes = require("./routes/taskRoutes");
require("./database");

const app = express();

app.use(cors());
app.use(express.json());

// Register routes correctly
app.use("/api/tasks", taskRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Kanban API is running");
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
