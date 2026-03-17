const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const { Op }  = require("sequelize");
const { Project, Task, User, AuthUser, ProjectMember, Notification } = require("../models");

const getAuthUser = (req) => {
  try {
    const h = req.headers.authorization;
    if (!h) return null;
    return jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
  } catch { return null; }
};

// ── GET /api/projects ── filtered by membership ──
router.get("/", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded) return res.status(401).json({ message: "Not authenticated" });

    let projects;

    if (decoded.role === "admin") {
      projects = await Project.findAll({
        include: [
          { model: Task, as: "tasks",       attributes: ["id"] },
          { model: User, as: "teamMembers", attributes: ["id"] },
        ],
      });
    } else {
      // Only projects where user is in project_members
      const memberships = await ProjectMember.findAll({
        where: { userId: decoded.id },
        attributes: ["projectId"],
      });
      const projectIds = memberships.map(m => m.projectId);

      if (projectIds.length === 0) return res.json([]); // No access to any project

      projects = await Project.findAll({
        where: { id: { [Op.in]: projectIds } },
        include: [
          { model: Task, as: "tasks",       attributes: ["id"] },
          { model: User, as: "teamMembers", attributes: ["id"] },
        ],
      });
    }

    res.json(projects.map(p => ({
      id:          p.id,
      name:        p.name,
      description: p.description,
      color:       p.color,
      icon:        p.icon,
      taskCount:   p.tasks?.length       || 0,
      memberCount: p.teamMembers?.length || 0,
      createdAt:   p.createdAt,
    })));
  } catch (err) {
    console.error("GET /projects error:", err.message);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// ── POST /api/projects ── Admin only ──
router.post("/", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded)                    return res.status(401).json({ message: "Not authenticated" });
    if (decoded.role !== "admin")    return res.status(403).json({ message: "Only admins can create projects" });

    const { name, description, color, icon } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const project = await Project.create({ name, description, color, icon });

    // Auto-add creating admin as member
    await ProjectMember.create({ projectId: project.id, userId: decoded.id, addedBy: decoded.id });

    res.status(201).json({ ...project.toJSON(), taskCount: 0, memberCount: 1 });
  } catch (err) {
    console.error("POST /projects error:", err.message);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// ── PUT /api/projects/:id ── Admin only ──
router.put("/:id", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || decoded.role !== "admin") return res.status(403).json({ message: "Admin only" });
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    await project.update(req.body);
    res.json(project);
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

// ── DELETE /api/projects/:id ── Admin only (CASCADE DELETES) ──
router.delete("/:id", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete projects" });
    }

    const projectId = req.params.id;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const projectName = project.name;
    console.log(`🗑️ Admin ${decoded.name} deleting project: ${projectName}`);

    // CASCADE DELETE - Delete all related data in correct order
    
    // 1. Delete notifications
    const deletedNotifications = await Notification.destroy({ 
      where: { projectId } 
    });
    console.log(`  ✅ Deleted ${deletedNotifications} notifications`);

    // 2. Delete tasks
    const deletedTasks = await Task.destroy({ 
      where: { project_id: projectId } 
    });
    console.log(`  ✅ Deleted ${deletedTasks} tasks`);

    // 3. Delete project members
    const deletedMembers = await ProjectMember.destroy({ 
      where: { projectId } 
    });
    console.log(`  ✅ Deleted ${deletedMembers} project members`);

    // 4. Delete users in users table for this project
    const deletedUsers = await User.destroy({ 
      where: { project_id: projectId } 
    });
    console.log(`  ✅ Deleted ${deletedUsers} user assignments`);

    // 5. Finally delete the project
    await project.destroy();
    console.log(`  ✅ Deleted project: ${projectName}`);

    res.json({ 
      message: "Project deleted successfully",
      projectName,
      stats: {
        notifications: deletedNotifications,
        tasks: deletedTasks,
        members: deletedMembers,
        users: deletedUsers
      }
    });

  } catch (err) {
    console.error("❌ Delete project error:", err);
    res.status(500).json({ message: "Failed to delete project", error: err.message });
  }
});

// ── GET /api/projects/:id/members ──
router.get("/:id/members", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded) return res.status(401).json({ message: "Not authenticated" });

    const members = await ProjectMember.findAll({
      where: { projectId: req.params.id },
      include: [{
        model: AuthUser,
        as: "authUser",
        attributes: ["id","name","email","role","avatarColor","avatarUrl","jobTitle","level","department"],
      }],
    });

    res.json(members.map(m => ({
      ...m.authUser?.toJSON(),
      joinedProjectAt: m.createdAt,
    })));
  } catch (err) {
    console.error("GET members error:", err.message);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// ── POST /api/projects/:id/members ── Admin adds user ──
router.post("/:id/members", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || decoded.role !== "admin") return res.status(403).json({ message: "Only admins can add members" });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await AuthUser.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await ProjectMember.findOne({ where: { projectId: req.params.id, userId } });
    if (existing) return res.status(409).json({ message: `${user.name} is already a member` });

    await ProjectMember.create({ projectId: req.params.id, userId, addedBy: decoded.id });

    // Return safe user object
    const { password, resetToken, resetTokenExpiry, ...safeUser } = user.toJSON();
    res.status(201).json({ ...safeUser, joinedProjectAt: new Date() });
  } catch (err) {
    console.error("POST members error:", err.message);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// ── DELETE /api/projects/:id/members/:userId ── Admin removes user ──
router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || decoded.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const deleted = await ProjectMember.destroy({
      where: { projectId: req.params.id, userId: req.params.userId },
    });
    if (!deleted) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member removed" });
  } catch (err) { res.status(500).json({ message: "Failed", error: err.message }); }
});

// ── GET /api/projects/:id/available-users ──
// Returns ALL registered users NOT yet in this project
router.get("/:id/available-users", async (req, res) => {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || decoded.role !== "admin") return res.status(403).json({ message: "Admin only" });

    // Get IDs already in this project
    const existing = await ProjectMember.findAll({
      where: { projectId: req.params.id },
      attributes: ["userId"],
    });
    const existingIds = existing.map(m => m.userId);

    // Return ALL auth users not already members — no role filter
    const available = await AuthUser.findAll({
      where: existingIds.length > 0 ? { id: { [Op.notIn]: existingIds } } : {},
      attributes: ["id","name","email","role","avatarColor","avatarUrl","jobTitle","level","department"],
      order: [["name", "ASC"]],
    });

    console.log(`Available users for project ${req.params.id}:`, available.length);
    res.json(available);
  } catch (err) {
    console.error("GET available-users error:", err.message);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

module.exports = router;