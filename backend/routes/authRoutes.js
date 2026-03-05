const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const { AuthUser } = require("../models");

// ── Email service ──
let emailService = {};
try { emailService = require("../services/emailService"); } catch(e) {}

// ── Multer ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `avatar_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith("image/") ? cb(null,true) : cb(new Error("Images only")) });

// ── OTP store ──
const otpStore = new Map();

const makeToken = (user, remember=false) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: remember?"30d":"7d" });

const safeUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  avatarColor: u.avatarColor, avatarUrl: u.avatarUrl,
  level: u.level, department: u.department,
  internType: u.internType, mentorId: u.mentorId,
  bio: u.bio, jobTitle: u.jobTitle,
  skills: u.skills, joinedDate: u.joinedDate,
  isActive: u.isActive !== 0 && u.isActive !== false, // normalize TINYINT 0/1 → boolean
});

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

// ── POST /send-otp ──
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email))
      return res.status(400).json({ message: "Valid email required" });

    // Allow re-registration from same email if previously deactivated
    // Use raw SQL — TINYINT isActive: 1=active, 0=deactivated
    const { sequelize: seq } = require("../models");
    const activeRows = await seq.query(
      "SELECT id FROM auth_users WHERE email = ? AND isActive = 1 LIMIT 1",
      { replacements: [email], type: seq.QueryTypes.SELECT }
    );
    if (activeRows.length > 0) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiry, verified: false });
    console.log(`📧 OTP for ${email}: ${otp}`);
    if (emailService.sendOtpEmail) await emailService.sendOtpEmail({ email, otp });
    res.json({ message: "OTP sent! Check your email." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP: " + err.message });
  }
});

// ── POST /verify-otp ──
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ message: "No OTP sent to this email." });
  if (Date.now() > record.expiry) { otpStore.delete(email); return res.status(400).json({ message: "OTP expired." }); }
  if (record.otp !== otp) return res.status(400).json({ message: "Incorrect OTP." });
  record.verified = true;
  res.json({ message: "Email verified!" });
});

// ── POST /register ──
// Allows re-registration from a deactivated email (creates a NEW row)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, avatarColor } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be 6+ characters" });

    const record = otpStore.get(email);
    if (!record || !record.verified)
      return res.status(400).json({ message: "Email not verified. Please verify OTP first." });

    // If there's an existing ACTIVE account, block
    const existing = await AuthUser.findOne({ where: { email } });
    if (existing && existing.isActive !== 0 && existing.isActive !== false) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // If deactivated account exists with same email — create a NEW account row
    // (old one stays deactivated, new one is fresh and active)
    const user = await AuthUser.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: "member", // always member — admin assigns role from Accounts page
      avatarColor,
      isActive: true,
    });
    otpStore.delete(email);
    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed: " + err.message });
  }
});

// ── POST /login — blocked if isActive = false ──
router.post("/login", async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    // Find ALL accounts for this email, use raw DB value for isActive check
    const { sequelize } = require("../models");
    const allUsers = await sequelize.query(
      "SELECT * FROM auth_users WHERE email = ? ORDER BY id DESC",
      { replacements: [email], type: sequelize.QueryTypes.SELECT }
    );
    // isActive stored as TINYINT: 1 = active, 0 = deactivated
    const user = allUsers.find(u => Number(u.isActive) === 1);
    const deactivatedUser = allUsers.find(u => Number(u.isActive) === 0);

    if (!user) {
      if (deactivatedUser) {
        return res.status(403).json({ message: "Your account has been deactivated. Contact your admin or re-register with a new account." });
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({ token: makeToken(user, remember), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed: " + err.message });
  }
});

// ── GET /me ──
router.get("/me", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "No token" });
  try {
    const user = await AuthUser.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isActive === 0 || user.isActive === false) return res.status(403).json({ message: "Account deactivated" });
    res.json(safeUser(user));
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ── PUT /profile ──
router.put("/profile", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "No token" });
  try {
    const user = await AuthUser.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // NOTE: We intentionally NEVER allow role to be set here — use /admin/accounts/:id/role
    const { name, email, avatarColor, jobTitle, bio, department, level,
            internType, employmentType, mentorId, skills, joinedDate, joinedAt } = req.body;
    const update = {};
    // role, isActive are protected — never updated via this endpoint
    if (name        != null) update.name        = name;
    if (email       != null) update.email       = email;
    if (avatarColor != null) update.avatarColor = avatarColor;
    if (jobTitle    != null) update.jobTitle    = jobTitle;
    if (bio         != null) update.bio         = bio;
    if (department  != null) update.department  = department;
    if (level       != null) update.level       = level || null;
    if (mentorId    != null) update.mentorId    = mentorId || null;
    const empType = internType || employmentType;
    if (empType  != null) update.internType  = empType || null;
    if (skills   != null) update.skills      = Array.isArray(skills) ? skills.join(", ") : (skills || null);
    const jDate = joinedDate || joinedAt;
    if (jDate    != null) update.joinedDate  = jDate || null;
    await user.update(update);
    await user.reload();
    res.json(safeUser(user));
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile: " + err.message });
  }
});

// ── POST /upload-avatar ──
router.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "No token" });
  try {
    const user = await AuthUser.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, "../uploads/avatars", path.basename(user.avatarUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    res.status(500).json({ message: "Upload failed: " + err.message });
  }
});

// ── PUT /change-password ──
router.put("/change-password", async (req, res) => {
  const decoded = getDecoded(req);
  if (!decoded) return res.status(401).json({ message: "No token" });
  try {
    const user = await AuthUser.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { currentPassword, newPassword } = req.body;
    if (!await bcrypt.compare(currentPassword, user.password))
      return res.status(401).json({ message: "Current password is incorrect" });
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "New password must be 6+ chars" });
    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed: " + err.message });
  }
});

// ── POST /forgot-password ──
router.post("/forgot-password", async (req, res) => {
  try {
    const user = await AuthUser.findOne({ where: { email: req.body.email, isActive: true } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await user.update({ resetToken: token, resetTokenExpiry: Date.now() + 3600000 });
      const resetUrl = `${process.env.FRONTEND_URL||"http://localhost:5173"}/reset-password?token=${token}`;
      if (emailService.sendPasswordResetEmail)
        await emailService.sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });
    }
    res.json({ message: "If that email exists, a reset link was sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed: " + err.message });
  }
});

// ── POST /reset-password ──
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await AuthUser.findOne({ where: { resetToken: token } });
    if (!user || user.resetTokenExpiry < Date.now())
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    await user.update({ password: await bcrypt.hash(password,10), resetToken: null, resetTokenExpiry: null });
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed: " + err.message });
  }
});

// ── GET /users — all active registered users (for assignee dropdowns) ──
router.get("/users", async (req, res) => {
  try {
    const users = await AuthUser.findAll({
      attributes: ["id","name","email","jobTitle","role","department","avatarColor","avatarUrl","isActive"],
      order: [["name","ASC"]],
    });
    res.json(users.filter(u => u.isActive !== 0 && u.isActive !== false));
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

// ═══════════════════════════════════════════════
// ADMIN ACCOUNT MANAGEMENT
// ═══════════════════════════════════════════════

// GET /auth/admin/accounts — all registered auth_users (admin only)
router.get("/admin/accounts", requireAdmin, async (req, res) => {
  try {
    const accounts = await AuthUser.findAll({
      attributes: ["id","name","email","role","isActive","createdAt","avatarColor","avatarUrl","department","jobTitle"],
      order: [["id","DESC"]],
    });
    // Normalize TINYINT isActive (0/1) to boolean so frontend !== false check works
    const normalized = accounts.map(a => ({
      ...a.toJSON(),
      isActive: a.isActive !== 0 && a.isActive !== false,
    }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /auth/admin/accounts/:id/deactivate — deactivate account
router.patch("/admin/accounts/:id/deactivate", requireAdmin, async (req, res) => {
  try {
    const user = await AuthUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.id === req.decoded.id) return res.status(400).json({ message: "You cannot deactivate your own account" });
    // Use raw SQL to guarantee TINYINT 0 is written — ORM boolean coercion can be unreliable
    const { sequelize } = require("../models");
    await sequelize.query("UPDATE auth_users SET isActive = 0 WHERE id = ?", { replacements: [user.id] });
    await user.reload();
    res.json({ message: `${user.name}'s account deactivated`, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /auth/admin/accounts/:id/activate — re-activate account
router.patch("/admin/accounts/:id/activate", requireAdmin, async (req, res) => {
  try {
    const user = await AuthUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { sequelize } = require("../models");
    await sequelize.query("UPDATE auth_users SET isActive = 1 WHERE id = ?", { replacements: [user.id] });
    await user.reload();
    res.json({ message: `${user.name}'s account activated`, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /auth/admin/accounts/:id/role — change role (admin only)
router.patch("/admin/accounts/:id/role", requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ["admin","developer","member","intern"];
    if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });
    const user = await AuthUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.id === req.decoded.id) return res.status(400).json({ message: "Cannot change your own role" });
    const oldRole = user.role;
    await user.update({ role });
    // Sync role to ALL rows in users table
    try {
      const { User, Notification, sequelize: seq } = require("../models");
      const lowerRole = role.toLowerCase();
      await User.update({ role: lowerRole }, { where: { email: user.email } });
      await seq.query("UPDATE users SET role = ? WHERE email = ?", { replacements: [lowerRole, user.email] });

      // In-app notification to the user
      const ROLE_EMOJI = { admin: "👑", developer: "💻", member: "👤", intern: "🌱" };
      const emoji = ROLE_EMOJI[lowerRole] || "🔔";
      await Notification.create({
        userId:    user.id,
        type:      "team",
        message:   emoji + " Your role has been updated to " + role,
        sub:       "Changed by admin · Welcome to your new role!",
        isRead:    false,
      });

      // Beautiful email notification
      const adminUser = req.decoded ? await AuthUser.findByPk(req.decoded.id) : null;
      const adminName = adminUser?.name || "Your admin";
      if (emailService.sendRoleAssignmentEmail) {
        await emailService.sendRoleAssignmentEmail({
          name:    user.name,
          email:   user.email,
          role:    role,
          oldRole: oldRole,
          adminName,
        }).catch(e => console.warn("Role email warning:", e.message));
      }
    } catch(e) {
      console.error("Role sync failed:", e.message);
    }
    res.json({ message: user.name + " is now a " + role, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /auth/admin/accounts/:id/profile — update department, employmentType, level (admin only)
router.patch("/admin/accounts/:id/profile", requireAdmin, async (req, res) => {
  try {
    const { department, employmentType, level } = req.body;
    const user = await AuthUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const update = {};
    if (department     !== undefined) update.department = department || null;
    // employmentType is stored in internType column
    if (employmentType !== undefined) update.internType = employmentType || null;
    if (level          !== undefined) update.level      = level || null;
    await user.update(update);
    await user.reload();

    // Also sync department to users table
    try {
      const { User } = require("../models");
      if (department !== undefined)
        await User.update({ department: department || null }, { where: { email: user.email } });
    } catch(e) { console.warn("Profile sync warning:", e.message); }

    res.json({ message: "Profile updated", user: safeUser(user) });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;