const express = require("express");
const router = express.Router();
const sequelize = require("../database");

// Access User model from Sequelize
const User = sequelize.models.User;

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.create({
      name,
      email,
      role,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create user",
    });
  }
});

module.exports = router;

