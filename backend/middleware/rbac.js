/**
 * Role-Based Access Control middleware
 *
 * Permissions matrix:
 *  admin     → everything
 *  developer → create/edit tasks, view all, cannot delete projects/users
 *  member    → view everything, update task status only, no create/delete
 *  intern    → view + create own tasks + update own tasks, no delete
 */

const jwt = require("jsonwebtoken");
const { AuthUser } = require("../models");

// Attach user from JWT to req.user (used by all protected routes)
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Authentication required" });
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await AuthUser.findByPk(decoded.id, {
      attributes: ["id","name","email","role","avatarColor","avatarUrl"],
    });
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Allow only specific roles
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      message: `Access denied. Required: ${roles.join(" or ")}. Your role: ${req.user.role}`,
    });
  next();
};

// Convenience helpers
const adminOnly      = requireRole("admin");
const adminOrDev     = requireRole("admin","developer");
const notIntern      = requireRole("admin","developer","member");
const allRoles       = requireRole("admin","developer","member","intern");

module.exports = { authenticate, requireRole, adminOnly, adminOrDev, notIntern, allRoles };