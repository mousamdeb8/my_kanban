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
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

module.exports = router;
