// File: backend/routes/gamificationRoutes.js
// Action: NEW FILE

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { UserPoint, Achievement, UserAchievement, PointTransaction, AuthUser } = require("../models");

const getAuth = (req) => {
  try {
    const h = req.headers.authorization;
    if (!h) return null;
    return jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
  } catch { return null; }
};

// GET /api/gamification/leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const decoded = getAuth(req);
    if (!decoded) return res.status(401).json({ message: "Not authenticated" });

    const topUsers = await UserPoint.findAll({
      include: [{
        model: AuthUser,
        as: "user",
        attributes: ["id", "name", "email", "avatarColor", "avatarUrl", "role"],
      }],
      order: [["points", "DESC"]],
      limit: 10,
    });

    res.json(topUsers.map((up, index) => ({
      rank: index + 1,
      user: up.user,
      points: up.points,
      level: up.level,
      current_streak: up.current_streak,
      total_tasks_completed: up.total_tasks_completed,
    })));

  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// GET /api/gamification/my-stats
router.get("/my-stats", async (req, res) => {
  try {
    const decoded = getAuth(req);
    if (!decoded) return res.status(401).json({ message: "Not authenticated" });

    let userPoint = await UserPoint.findOne({ where: { user_id: decoded.id } });
    
    if (!userPoint) {
      userPoint = await UserPoint.create({ user_id: decoded.id });
    }

    const achievements = await UserAchievement.findAll({
      where: { user_id: decoded.id },
      include: [{
        model: Achievement,
        as: "achievement",
      }],
      order: [["earned_at", "DESC"]],
    });

    const recentTransactions = await PointTransaction.findAll({
      where: { user_id: decoded.id },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    res.json({
      points: userPoint.points,
      level: userPoint.level,
      current_streak: userPoint.current_streak,
      longest_streak: userPoint.longest_streak,
      total_tasks_completed: userPoint.total_tasks_completed,
      total_reviews_given: userPoint.total_reviews_given,
      achievements: achievements.map(a => ({
        ...a.achievement.toJSON(),
        earned_at: a.earned_at,
      })),
      recent_transactions: recentTransactions,
    });

  } catch (err) {
    console.error("My stats error:", err);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// GET /api/gamification/achievements
router.get("/achievements", async (req, res) => {
  try {
    const decoded = getAuth(req);
    if (!decoded) return res.status(401).json({ message: "Not authenticated" });

    const allAchievements = await Achievement.findAll({
      order: [["points_reward", "DESC"]],
    });

    const userAchievements = await UserAchievement.findAll({
      where: { user_id: decoded.id },
      attributes: ["achievement_id", "earned_at"],
    });

    const earnedIds = userAchievements.map(ua => ua.achievement_id);

    res.json(allAchievements.map(a => ({
      ...a.toJSON(),
      earned: earnedIds.includes(a.id),
      earned_at: userAchievements.find(ua => ua.achievement_id === a.id)?.earned_at,
    })));

  } catch (err) {
    console.error("Achievements error:", err);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

module.exports = router;