const express = require("express");
const router  = express.Router();
const { Project, Task, User } = require("../models");

// GET all projects with task + member counts
router.get("/", async (req, res) => {
  try {
    const projects = await Project.findAll({ order: [["createdAt","DESC"]] });
    const result = await Promise.all(projects.map(async p => {
      const taskCount   = await Task.count({ where: { project_id: p.id } });
      const memberCount = await User.count({ where: { project_id: p.id } });
      return { ...p.toJSON(), taskCount, memberCount };
    }));
    res.json(result);
  } catch (err) {
    console.error("GET /projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects", error: err.message });
  }
});

// POST create project
router.post("/", async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const project = await Project.create({ name, description, color, icon });
    res.status(201).json(project);
  } catch (err) {
    console.error("POST /projects error:", err);
    res.status(500).json({ message: "Failed to create project", error: err.message });
  }
});

// PUT update project
router.put("/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    await project.update(req.body);
    res.json(project);
  } catch (err) {
    console.error("PUT /projects error:", err);
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    await project.destroy();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /projects error:", err);
    res.status(500).json({ message: "Failed to delete", error: err.message });
  }
});

module.exports = router;