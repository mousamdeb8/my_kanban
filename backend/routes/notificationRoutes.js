const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const { Notification } = require("../models");

const getDecoded = (req) => {
  try {
    const h = req.headers.authorization;
    if (!h) return null;
    return jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
  } catch { return null; }
};

// GET /api/notifications
router.get("/", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    const notifs = await Notification.findAll({
      where: { userId: decoded.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    res.json(notifs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/notifications — send notification to a user
router.post("/", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    const { userId, type, message, sub } = req.body;
    const notif = await Notification.create({
      userId, type: type || "info", message, sub: sub || null, isRead: false,
    });
    res.status(201).json(notif);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: decoded.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    await Notification.update({ isRead: true }, { where: { userId: decoded.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/notifications/clear
router.delete("/clear", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    await Notification.destroy({ where: { userId: decoded.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;