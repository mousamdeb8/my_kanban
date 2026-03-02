const express = require("express");
const router  = express.Router();
const { User } = require("../models");

// GET users scoped by project_id
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = Number(req.query.project_id);
    res.json(await User.findAll({ where }));
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// POST create user
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error("POST /users error:", err);
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});

// PUT update user
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    await user.update(req.body);
    res.json(user);
  } catch (err) {
    console.error("PUT /users error:", err);
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    await user.destroy();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /users error:", err);
    res.status(500).json({ message: "Failed to delete", error: err.message });
  }
});

module.exports = router;