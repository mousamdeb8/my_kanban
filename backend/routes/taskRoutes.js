const express = require("express");
const router  = express.Router();
const { Task, User, Project } = require("../models");
const { sendTaskAssignedEmail } = require("../services/emailService");

router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = Number(req.query.project_id);
    const tasks = await Task.findAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id","name","email"] }],
      order: [["createdAt","DESC"]],
    });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const full = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email"] }],
    });

    // Send assignment email if assignee has email
    if (full.user && full.user.email && req.body.project_id) {
      try {
        const project = await Project.findByPk(req.body.project_id);
        await sendTaskAssignedEmail({
          assigneeName:  full.user.name,
          assigneeEmail: full.user.email,
          taskTitle:     full.title,
          taskDescription: full.description || "",
          priority:      full.priority || "Medium",
          dueDate:       full.dueDate,
          projectName:   project?.name || "Kanban Project",
          assignedBy:    req.body.assignedBy || "A team member",
        });
      } catch (emailErr) {
        console.error("Email failed (task still created):", emailErr.message);
      }
    }

    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });

    const oldUserId = task.user_id;
    await task.update(req.body);

    const full = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email"] }],
    });

    // Send email if assignee CHANGED
    const newUserId = req.body.user_id;
    if (newUserId && newUserId !== oldUserId && full.user?.email) {
      try {
        const project = await Project.findByPk(full.project_id);
        await sendTaskAssignedEmail({
          assigneeName:    full.user.name,
          assigneeEmail:   full.user.email,
          taskTitle:       full.title,
          taskDescription: full.description || "",
          priority:        full.priority || "Medium",
          dueDate:         full.dueDate,
          projectName:     project?.name || "Kanban Project",
          assignedBy:      req.body.assignedBy || "A team member",
        });
      } catch (emailErr) {
        console.error("Email failed:", emailErr.message);
      }
    }

    res.json(full);
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });
    await task.update({ status: req.body.status });
    res.json(task);
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });
    await task.destroy();
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

module.exports = router;