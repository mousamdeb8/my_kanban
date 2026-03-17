const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const { Task, User, AuthUser, Notification } = require("../models");
const GamificationService = require("../services/gamificationService");

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

// Helper: Get or create user in users table from auth_users.id
async function getOrCreateUserForProject(authUserId, projectId) {
  if (!authUserId || !projectId) {
    console.log('⚠️ getOrCreateUserForProject: Missing params - authUserId:', authUserId, 'projectId:', projectId);
    return null;
  }
  
  try {
    // Get auth_user details
    const authUser = await AuthUser.findByPk(authUserId);
    if (!authUser) {
      console.log('⚠️ AuthUser not found for ID:', authUserId);
      return null;
    }

    console.log('📋 Found AuthUser:', {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      isActive: authUser.isActive
    });

    // Find or create corresponding user in users table
    const [user, created] = await User.findOrCreate({
      where: { 
        email: authUser.email,
        project_id: projectId 
      },
      defaults: {
        name: authUser.name,
        email: authUser.email,
        role: authUser.role || 'member',
        department: authUser.department,
        project_id: projectId
      }
    });

    console.log(created ? '✅ Created new user in users table' : '✅ Found existing user in users table');
    console.log('👤 User:', { id: user.id, name: user.name, email: user.email, role: user.role });

    return user;
  } catch (e) {
    console.error('❌ getOrCreateUserForProject error:', e.message);
    console.error('❌ Error details:', e);
    console.error('❌ Params were - authUserId:', authUserId, 'projectId:', projectId);
    return null;
  }
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
    
    // Enrich tasks with avatarColor from auth_users
    const enrichedTasks = await Promise.all(tasks.map(async (task) => {
      const taskJson = task.toJSON();
      if (taskJson.user && taskJson.user.email) {
        const authUser = await AuthUser.findOne({ 
          where: { email: taskJson.user.email },
          attributes: ["avatarColor", "avatarUrl"]
        });
        if (authUser) {
          taskJson.user.avatarColor = authUser.avatarColor;
          taskJson.user.avatarUrl = authUser.avatarUrl;
        }
      }
      return taskJson;
    }));
    
    res.json(enrichedTasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    if (!task) return res.status(404).json({ message: "Not found" });
    
    // Enrich with avatarColor from auth_users
    const taskJson = task.toJSON();
    if (taskJson.user && taskJson.user.email) {
      const authUser = await AuthUser.findOne({ 
        where: { email: taskJson.user.email },
        attributes: ["avatarColor", "avatarUrl"]
      });
      if (authUser) {
        taskJson.user.avatarColor = authUser.avatarColor;
        taskJson.user.avatarUrl = authUser.avatarUrl;
      }
    }
    
    res.json(taskJson);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  if (decoded.role === "member") return res.status(403).json({ message: "Members cannot create tasks" });
  
  try {
    // IMPORTANT: assignToUserId is the auth_users.id from the frontend dropdown
    const { assignToUserId, project_id, ...taskData } = req.body;
    
    // Get or create the user record in users table for this project
    let userId = null;
    if (assignToUserId && project_id) {
      const projectUser = await getOrCreateUserForProject(assignToUserId, project_id);
      if (projectUser) {
        userId = projectUser.id; // This is users.id
      }
    }

    // Create task with users.id as user_id and auth_users.id as assignedById
    const task = await Task.create({ 
      ...taskData,
      project_id,
      user_id: userId,
      assignedById: decoded.id  // The person creating the task (auth_users.id)
    });

    const full = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });

    // Enrich with avatarColor from auth_users
    const fullJson = full.toJSON();
    if (fullJson.user && fullJson.user.email) {
      const authUser = await AuthUser.findOne({ 
        where: { email: fullJson.user.email },
        attributes: ["avatarColor", "avatarUrl"]
      });
      if (authUser) {
        fullJson.user.avatarColor = authUser.avatarColor;
        fullJson.user.avatarUrl = authUser.avatarUrl;
      }
    }

    // Notify assignee
    if (fullJson.user?.email && fullJson.user.email !== decoded.email) {
      await notify({
        email: fullJson.user.email, type: "assigned",
        message: `📋 New task assigned to you by ${decoded.name || decoded.email}`,
        sub: fullJson.title, taskId: fullJson.id, projectId: fullJson.project_id,
      });
    }

    res.status(201).json(fullJson);  // Return enriched version
  } catch (err) { 
    console.error("Task creation error:", err);
    res.status(500).json({ message: err.message }); 
  }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  const decoded = getAuth(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });
  if (decoded.role === "member") return res.status(403).json({ message: "Members cannot edit tasks" });
  
  console.log('🔵 PUT /api/tasks/' + req.params.id);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 assignToUserId:', req.body.assignToUserId, 'type:', typeof req.body.assignToUserId);
  
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    if (!task) return res.status(404).json({ message: "Not found" });

    const oldAssigneeEmail = task.user?.email;
    const oldStatus = task.status;

    // Handle reassignment if assignToUserId is provided
    const { assignToUserId, ...updateData } = req.body;
    
    console.log('🎯 Extracted assignToUserId:', assignToUserId);
    console.log('🎯 task.project_id:', task.project_id);
    console.log('🎯 Condition check:', !!assignToUserId && !!task.project_id);
    
    if (assignToUserId && task.project_id) {
      console.log('✅ Calling getOrCreateUserForProject with:', assignToUserId, task.project_id);
      const projectUser = await getOrCreateUserForProject(assignToUserId, task.project_id);
      console.log('📥 getOrCreateUserForProject returned:', projectUser);
      if (projectUser) {
        updateData.user_id = projectUser.id;
        updateData.assignedById = decoded.id;
        console.log('✅ Setting user_id to:', projectUser.id);
      } else {
        console.warn('⚠️ getOrCreateUserForProject returned null!');
      }
    } else {
      console.warn('⚠️ Condition failed - assignToUserId:', assignToUserId, 'project_id:', task.project_id);
    }
    
    console.log('💾 Update data:', JSON.stringify(updateData, null, 2));

    await task.update(updateData);
    
    // AUTO-AWARD POINTS when task is completed
    if (updateData.status === "done" && oldStatus !== "done") {
      const isEarly = task.dueDate && new Date() < new Date(task.dueDate);
      const userId = task.user_id || updateData.user_id;
      if (userId) {
        try {
          // Get auth_user id from users table
          const taskUser = await User.findByPk(userId);
          if (taskUser) {
            const authUser = await AuthUser.findOne({ where: { email: taskUser.email } });
            if (authUser) {
              await GamificationService.awardTaskPoints(
                authUser.id,
                task.id,
                task.priority,
                isEarly
              );
            }
          }
        } catch (err) {
          console.error("Failed to award points:", err);
        }
      }
    }
    
    const updated = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });

    // Enrich with avatarColor from auth_users before returning
    const updatedJson = updated.toJSON();
    if (updatedJson.user && updatedJson.user.email) {
      const authUser = await AuthUser.findOne({ 
        where: { email: updatedJson.user.email },
        attributes: ["avatarColor", "avatarUrl"]
      });
      if (authUser) {
        updatedJson.user.avatarColor = authUser.avatarColor;
        updatedJson.user.avatarUrl = authUser.avatarUrl;
      }
    }

    const newAssigneeEmail = updatedJson.user?.email;
    const actorName = decoded.name || decoded.email;
    const pid = updatedJson.project_id;
    const tid = updatedJson.id;

    // New assignee notification
    if (newAssigneeEmail && newAssigneeEmail !== oldAssigneeEmail) {
      await notify({
        email: newAssigneeEmail, type: "assigned",
        message: `📋 You've been assigned a task by ${actorName}`,
        sub: updatedJson.title, taskId: tid, projectId: pid,
      });
    }

    // Status changed
    if (updateData.status && updateData.status !== oldStatus) {
      const fromLabel = STATUS_LABEL[oldStatus] || oldStatus;
      const toLabel = STATUS_LABEL[updateData.status] || updateData.status;
      const projectUsers = await User.findAll({ where: { project_id: pid } });
      for (const pu of projectUsers) {
        if (!pu.email) continue;
        const role = (pu.role || "").toLowerCase();
        if (!["admin","developer"].includes(role)) continue;
        const puAuth = await AuthUser.findOne({ where: { email: pu.email } });
        if (puAuth && puAuth.id === decoded.id) continue;
        await notify({
          email: pu.email, type: "status",
          message: `🔄 ${updatedJson.user?.name || actorName} moved "${updatedJson.title}"`,
          sub: `${fromLabel} → ${toLabel}`, taskId: tid, projectId: pid,
        });
      }
    }

    res.json(updatedJson);  // Return enriched version
  } catch (err) { 
    console.error("Task update error:", err);
    res.status(500).json({ message: err.message }); 
  }
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
    const pid = task.project_id;
    const tid = task.id;

    await task.update({ status: newStatus });

    const fromLabel = STATUS_LABEL[oldStatus] || oldStatus;
    const toLabel = STATUS_LABEL[newStatus] || newStatus;

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
        type: newStatus === "inreview" ? "review" : "status",
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
      id: Date.now(),
      reviewerId: decoded.id,
      reviewerName: decoded.name || decoded.email,
      verdict,
      comment: comment.trim(),
      fixDueDate: fixDueDate || null,
      originalDueDate: storedOriginal,
      rejectionNumber: verdict !== "approved" ? rejectionCount + 1 : null,
      taskStatusBefore: task.status,
      createdAt: new Date().toISOString(),
    };
    reviews.push(review);

    const update = { reviews: JSON.stringify(reviews), reviewVerdict: verdict };
    if (verdict === "needs_fix") {
      update.status = "todo";
      if (fixDueDate) update.dueDate = fixDueDate;
    } else if (verdict === "partial") {
      update.status = "inprogress";
      if (fixDueDate) update.dueDate = fixDueDate;
    }
    await task.update(update);

    // Notify the intern
    if (task.user?.email) {
      const VERDICT_MSG = {
        approved: "✅ Your task was approved — great work!",
        partial: "🔶 Your task needs minor fixes",
        needs_fix: "❌ Your task needs to be redone",
      };
      await notify({
        email: task.user.email,
        type: verdict === "approved" ? "review" : "status",
        message: VERDICT_MSG[verdict],
        sub: `"${task.title}"${fixDueDate ? ` · Fix by ${fixDueDate}` : ""}`,
        taskId: task.id,
        projectId: task.project_id,
      });
    }

    const updated = await Task.findByPk(task.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","role"] }],
    });
    
    // AUTO-AWARD POINTS for reviewing
    try {
      await GamificationService.awardReviewPoints(decoded.id, task.id);
    } catch (err) {
      console.error("Failed to award review points:", err);
    }
    
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