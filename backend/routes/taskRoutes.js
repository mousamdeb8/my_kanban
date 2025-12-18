const express = require("express");
const router = express.Router();
const { Task, User } = require("../models");

// 🔹 GET all tasks with user details
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: { model: User, as: "user", attributes: ["id", "name", "email"] },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 GET task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: { model: User, as: "user", attributes: ["id", "name", "email"] },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 CREATE task
router.post("/", async (req, res) => {
  try {
    // Validate user_id
    const user = await User.findByPk(req.body.user_id);
    if (!user) return res.status(400).json({ error: "Invalid user_id" });

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || null,
      priority: req.body.priority || "Low",
      status: req.body.status || "todo",
      user_id: req.body.user_id,
      dueDate: req.body.dueDate || null,
      tag: req.body.tag || null,
      attachments: req.body.attachments || [],
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 UPDATE STATUS ONLY (drag & drop)
router.patch("/:id/status", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    await task.update({ status: req.body.status.toLowerCase() });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 UPDATE FULL TASK
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Validate user_id if provided
    if (req.body.user_id) {
      const user = await User.findByPk(req.body.user_id);
      if (!user) return res.status(400).json({ error: "Invalid user_id" });
    }

    await task.update({
      title: req.body.title,
      description: req.body.description || null,
      priority: req.body.priority || "Low",
      status: req.body.status || task.status,
      user_id: req.body.user_id,
      dueDate: req.body.dueDate || null,
      tag: req.body.tag || null,
      attachments: req.body.attachments || [],
    });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 DELETE task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    await task.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
