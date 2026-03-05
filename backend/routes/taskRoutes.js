const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const { Task, User, AuthUser, Notification } = require("../models");

const getAuth = (req) => {
  try {
    const h = req.headers.authorization;
    if (!h) return null;
    return jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
  } catch { return null; }
};

// notify by email → looks up auth_user → creates notification with taskId + projectId
async function notify({ email, type, message, sub, taskId, projectId }) {
  if (!email) return;
  try {
    const authUser = await AuthUser.findOne({ where: { email } });
    if (authUser) {
      await Notification.create({ userId: authUser.id, type, message, sub: sub || null, taskId: taskId || null, projectId: projectId || null });
    }
  } catch (e) { console.warn("Notify error:", e.message); }
}

async function notifyById({ userId, type, message, sub, taskId, projectId }) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, message, sub: sub || null, taskId: taskId || null, projectId: projectId || null });
  } catch (e) { console.warn("NotifyById error:", e.message); }
}

const STATUS_LABEL = { todo: "To Do", inprogress: "In Progress", inreview: "In Review", done: "Done" };

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = Number(req.query.project_id);
    const tasks = await Task.findAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
      order: [["id", "DESC"]],
    });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    if (!task) return res.status(404).json({ message: "Not found" });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  if (decoded.role === "member") return res.status(403).json({ message: "Members cannot create tasks" });
  try {
    const task = await Task.create({ ...req.body, assignedById: decoded.id });
    const full = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    // Notify assignee
    if (full.user?.email && full.user.email !== decoded.email) {
      await notify({
        email: full.user.email, type: "assigned",
        message: `📋 New task assigned to you by ${decoded.name || decoded.email}`,
        sub: full.title, taskId: full.id, projectId: full.project_id,
      });
    }
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  if (decoded.role === "member") return res.status(403).json({ message: "Members cannot edit tasks" });
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    if (!task) return res.status(404).json({ message: "Not found" });

    const oldAssigneeEmail = task.user?.email;
    const oldStatus        = task.status;
    await task.update(req.body);
    const updated = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });

    const newAssigneeEmail = updated.user?.email;
    const actorName        = decoded.name || decoded.email;
    const pid              = updated.project_id;
    const tid              = updated.id;

    // New assignee notification
    if (newAssigneeEmail && newAssigneeEmail !== oldAssigneeEmail) {
      // Update assignedById to current user when reassigning
      await task.update({ assignedById: decoded.id });
      await notify({
        email: newAssigneeEmail, type: "assigned",
        message: `📋 You've been assigned a task by ${actorName}`,
        sub: updated.title, taskId: tid, projectId: pid,
      });
    }

    // Status changed
    if (req.body.status && req.body.status !== oldStatus) {
      const fromLabel = STATUS_LABEL[oldStatus]       || oldStatus;
      const toLabel   = STATUS_LABEL[req.body.status] || req.body.status;
      const projectUsers = await User.findAll({ where: { project_id: pid } });
      for (const pu of projectUsers) {
        if (!pu.email) continue;
        const role = (pu.role || "").toLowerCase();
        if (!["admin","developer"].includes(role)) continue;
        const puAuth = await AuthUser.findOne({ where: { email: pu.email } });
        if (puAuth && puAuth.id === decoded.id) continue;
        await notify({
          email: pu.email, type: "status",
          message: `🔄 ${updated.user?.name || actorName} moved "${updated.title}"`,
          sub: `${fromLabel} → ${toLabel}`, taskId: tid, projectId: pid,
        });
      }
    }

    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/tasks/:id/status  — drag & drop
router.patch("/:id/status", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    if (!task) return res.status(404).json({ message: "Not found" });

    const oldStatus = task.status;
    const newStatus = req.body.status;
    const actorName = decoded.name || decoded.email;
    const pid       = task.project_id;
    const tid       = task.id;

    await task.update({ status: newStatus });

    const fromLabel = STATUS_LABEL[oldStatus] || oldStatus;
    const toLabel   = STATUS_LABEL[newStatus]  || newStatus;

    // Notify all admins/developers on the project
    const projectUsers = await User.findAll({ where: { project_id: pid } });
    for (const pu of projectUsers) {
      if (!pu.email) continue;
      const role = (pu.role || "").toLowerCase();
      if (!["admin","developer"].includes(role)) continue;
      const puAuth = await AuthUser.findOne({ where: { email: pu.email } });
      if (puAuth && puAuth.id === decoded.id) continue;
      await notify({
        email: pu.email,
        type:  newStatus === "inreview" ? "review" : "status",
        message: newStatus === "inreview"
          ? `👀 "${task.title}" is ready for review`
          : `🔄 ${task.user?.name || actorName} moved "${task.title}"`,
        sub: `${fromLabel} → ${toLabel}`,
        taskId: tid, projectId: pid,
      });
    }

    // Notify assignee if someone else moved their task
    if (task.user?.email && task.user.email !== decoded.email) {
      await notify({
        email: task.user.email, type: "status",
        message: `🔄 Your task was moved by ${actorName}`,
        sub: `"${task.title}": ${fromLabel} → ${toLabel}`,
        taskId: tid, projectId: pid,
      });
    }

    const updated = await Task.findByPk(tid, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  if (decoded.role !== "admin") return res.status(403).json({ message: "Only admins can delete tasks" });
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });
    await task.destroy();
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/tasks/:id/review
router.post("/:id/review", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  if (!["admin","developer"].includes((decoded.role||"").toLowerCase()))
    return res.status(403).json({ message: "Only admins and developers can review" });

  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    if (!task) return res.status(404).json({ message: "Not found" });

    const { verdict, comment, fixDueDate, originalDueDate } = req.body;
    const allowed = ["approved","needs_fix","partial"];
    if (!allowed.includes(verdict)) return res.status(400).json({ message: "Invalid verdict" });
    if (!comment?.trim()) return res.status(400).json({ message: "Comment required" });

    let reviews = [];
    try { reviews = task.reviews ? JSON.parse(task.reviews) : []; } catch { reviews = []; }

    // Count total rejections so far
    const rejectionCount = reviews.filter(r => r.verdict === "needs_fix" || r.verdict === "partial").length;

    const storedOriginal = originalDueDate || task.dueDate || null;
    const review = {
      id:              Date.now(),
      reviewerId:      decoded.id,
      reviewerName:    decoded.name || decoded.email,
      verdict,
      comment:         comment.trim(),
      fixDueDate:      fixDueDate || null,
      originalDueDate: storedOriginal,
      rejectionNumber: verdict !== "approved" ? rejectionCount + 1 : null,
      taskStatusBefore: task.status,   // always capture what status it was in
      createdAt:        new Date().toISOString(),
    };
    reviews.push(review);

    // Update: always keep reviewVerdict so history tab stays visible
    const update = { reviews: JSON.stringify(reviews), reviewVerdict: verdict };
    if (verdict === "needs_fix") {
      update.status  = "todo";       // needs_fix → back to To Do, must restart
      if (fixDueDate) update.dueDate = fixDueDate;
    } else if (verdict === "partial") {
      update.status  = "inprogress"; // partial → back to In Progress, fix and resubmit
      if (fixDueDate) update.dueDate = fixDueDate;
    }
    // approved → status stays "done", task is complete
    await task.update(update);

    // Notify the intern
    if (task.user?.email) {
      const VERDICT_MSG = {
        approved:  "✅ Your task was approved — great work!",
        partial:   "🔶 Your task needs minor fixes",
        needs_fix: "❌ Your task needs to be redone",
      };
      await notify({
        email:     task.user.email,
        type:      verdict === "approved" ? "review" : "status",
        message:   VERDICT_MSG[verdict],
        sub:       `"${task.title}"${fixDueDate ? ` · Fix by ${fixDueDate}` : ""}`,
        taskId:    task.id,
        projectId: task.project_id,
      });
    }

    const updated = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    res.json(updated);
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id/reviews
router.get("/:id/reviews", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });
    let reviews = [];
    try { reviews = task.reviews ? JSON.parse(task.reviews) : []; } catch { reviews = []; }
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;