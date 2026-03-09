const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const { User, AuthUser } = require("../models");

const getDecoded = (req) => {
  try {
    const h = req.headers.authorization;
    if (!h) return null;
    return jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
  } catch { return null; }
};

const requireAdmin = (req, res, next) => {
  const d = getDecoded(req);
  if (!d) return res.status(401).json({ message: "Not authenticated" });
  if (d.role !== "admin") return res.status(403).json({ message: "Admin only" });
  req.decoded = d;
  next();
};

// ─────────────────────────────────────────────────────────────────
// NEW: GET /api/users/active — Returns ALL active users from auth_users
// Returns separate lists: assigners (admin+developer) and assignees (everyone)
router.get("/active", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });

  try {
    // Fetch ALL active users from auth_users table
    const activeUsers = await AuthUser.findAll({
      where: { 
        isActive: 1  // Only active users
      },
      attributes: ["id", "name", "email", "role", "avatarColor", "avatarUrl", "department"],
      order: [["name", "ASC"]],
    });

    // Format all users
    const allUsers = activeUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl,
    }));

    // Split into two groups
    // Assigners: Only admin and developer (who can create/assign tasks)
    const assigners = allUsers.filter(u => 
      ["admin", "developer"].includes((u.role || "").toLowerCase())
    );

    // Assignees: Everyone (admin, developer, member, intern - all can be assigned work)
    const assignees = allUsers;

    // Return both lists
    res.json({
      assigners,  // For "Assigned By" dropdown
      assignees   // For "Assign To" dropdown
    });
  } catch (err) {
    console.error("GET /active error:", err.message);
    res.status(500).json({ message: "Failed to fetch active users", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/users/assignable?project_id=x
router.get("/assignable", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "Not authenticated" });

  try {
    const projectId = Number(req.query.project_id);

    // Always fetch fresh from auth_users — this is the source of truth for roles
    const allAuthUsers = await AuthUser.findAll({
      attributes: ["id", "name", "email", "role", "avatarColor", "department"],
    });
    const authUsers = allAuthUsers.filter(au => au.isActive !== false);

    // Existing users for this project
    const existingUsers = await User.findAll({
      where: { project_id: projectId },
      attributes: ["id", "name", "email", "role"],
    });
    const existingEmailMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));

    // Sync all auth_users into users table — insert missing, UPDATE existing roles
    for (const au of authUsers) {
      const key = au.email.toLowerCase();
      const freshRole = (au.role || "member").toLowerCase();

      if (!existingEmailMap.has(key)) {
        // Insert new
        try {
          await User.create({
            name:       au.name,
            email:      au.email,
            role:       freshRole,
            department: au.department || null,
            project_id: projectId,
          });
        } catch (e) {
          if (!e.message.includes("Duplicate") && !e.message.includes("unique") && !e.message.includes("ER_DUP_ENTRY")) {
            console.warn("Auto-sync insert warning:", e.message);
          }
        }
      } else {
        // Update role if it changed — auth_users is the source of truth
        const existingUser = existingEmailMap.get(key);
        if ((existingUser.role || "").toLowerCase() !== freshRole) {
          try {
            await User.update({ role: freshRole }, { where: { email: au.email, project_id: projectId } });
          } catch (e) {
            console.warn("Auto-sync role update warning:", e.message);
          }
        }
      }
    }

    // Re-fetch with fresh roles
    const finalUsers = await User.findAll({
      where: { project_id: projectId },
      attributes: ["id", "name", "email", "role", "department"],
      order: [["id", "ASC"]],
    });

    // Enrich with avatarColor from auth_users
    const authMap = new Map(authUsers.map(au => [au.email.toLowerCase(), au]));
    const result  = finalUsers.map(u => ({
      id:          u.id,
      name:        u.name,
      email:       u.email,
      role:        authMap.get(u.email.toLowerCase())?.role?.toLowerCase() || u.role, // always use auth_users role
      department:  u.department,
      avatarColor: authMap.get(u.email.toLowerCase())?.avatarColor || null,
      authId:      authMap.get(u.email.toLowerCase())?.id || null, // expose auth_users.id for canReview check
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /assignable error:", err.message);
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// GET /api/users?project_id=x  — Summary team list
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = Number(req.query.project_id);
    const users = await User.findAll({
      where,
      attributes: ["id", "name", "email", "role", "department", "project_id"],
      order: [["id", "ASC"]],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// POST /api/users — admin adds member manually from Summary
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, email, role, department, project_id } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email required" });
    const user = await User.create({
      name, email,
      role:       (role || "member").toLowerCase(),
      department: department || null,
      project_id,
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError")
      return res.status(400).json({ message: "This person is already in this project" });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    await user.update(req.body);
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/users/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    await user.destroy();
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;