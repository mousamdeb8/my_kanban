const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE task
router.post("/", async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || null,
      priority: req.body.priority || "Low",
      status: req.body.status || "todo",
      assignee: req.body.assignee || "Unassigned",
      dueDate: req.body.dueDate || null,
      tag: req.body.tag || null,
      attachments: req.body.attachments || [],
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE STATUS ONLY (drag & drop)
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

// UPDATE FULL TASK
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    await task.update({
      title: req.body.title,
      description: req.body.description || null,
      priority: req.body.priority || "Low",
      status: req.body.status || task.status,
      assignee: req.body.assignee || "Unassigned",
      dueDate: req.body.dueDate || null,
      tag: req.body.tag || null,
      attachments: req.body.attachments || [],
    });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
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
