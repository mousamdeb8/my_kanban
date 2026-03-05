/**
 * Email Service — Kanban Workspace
 * Uses nodemailer. Set EMAIL_USER + EMAIL_PASS in .env
 * Falls back to console.log if not configured (dev mode).
 */

let transporter = null;

try {
  const nodemailer = require("nodemailer");
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    console.log("📧 Email service ready:", process.env.GMAIL_USER);
  } else {
    console.log("📧 Email service: not configured (set GMAIL_USER + GMAIL_APP_PASSWORD in .env)");
  }
} catch (e) {
  console.warn("📧 nodemailer not installed:", e.message);
}

async function send({ to, subject, html }) {
  if (!transporter) {
    console.log(`📧 [DEV EMAIL] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, "").slice(0, 300)}...`);
    return;
  }
  await transporter.sendMail({
    from: `"Kanban Workspace" <${process.env.GMAIL_USER}>`,
    to, subject, html,
  });
}

// ── OTP Email ──
async function sendOtpEmail({ email, otp }) {
  await send({
    to:      email,
    subject: "Your Kanban Verification Code",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;margin-bottom:12px;">K</div>
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:700;">Verify your email</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:8px 0 0;">Kanban Workspace</p>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">Use this code to complete your registration:</p>
      <div style="background:#0f172a;border:2px solid #3b82f6;border-radius:14px;padding:24px;margin:0 auto 24px;display:inline-block;">
        <span style="font-size:40px;font-weight:900;color:#3b82f6;letter-spacing:12px;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0;">This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:13px;margin:8px 0 0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div style="padding:20px;text-align:center;border-top:1px solid #334155;">
      <p style="color:#475569;font-size:12px;margin:0;">© Kanban Workspace · Secure email verification</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ── Role Assignment Email ──
async function sendRoleAssignmentEmail({ name, email, role, oldRole, adminName }) {
  const ROLE_CONFIG = {
    admin:     { emoji: "👑", color: "#ef4444", bg: "#fef2f2", label: "Administrator",  perms: "Full access — manage projects, teams, and all workspace settings." },
    developer: { emoji: "💻", color: "#8b5cf6", bg: "#f5f3ff", label: "Developer",       perms: "Create and edit tasks, assign work, and review team submissions." },
    member:    { emoji: "👤", color: "#3b82f6", bg: "#eff6ff", label: "Member",           perms: "View all tasks and update your own task statuses." },
    intern:    { emoji: "🌱", color: "#22c55e", bg: "#f0fdf4", label: "Intern",            perms: "View tasks and create your own tasks. Your work will be reviewed by a developer." },
  };
  const cfg = ROLE_CONFIG[role.toLowerCase()] || ROLE_CONFIG.member;

  await send({
    to:      email,
    subject: `${cfg.emoji} Your Kanban role has been updated — you're now a ${cfg.label}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:36px 32px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;margin-bottom:16px;">K</div>
      <h1 style="color:#fff;font-size:24px;margin:0;font-weight:700;">Role Updated!</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:8px 0 0;">Your access level has changed</p>
    </div>

    <!-- Greeting -->
    <div style="padding:32px 32px 0;">
      <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong> 👋</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0;">
        <strong style="color:#cbd5e1;">${adminName}</strong> has updated your role in the Kanban Workspace.
        Here's what's changed:
      </p>
    </div>

    <!-- Role change card -->
    <div style="padding:24px 32px;">
      <div style="background:#0f172a;border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;border:1px solid #334155;">
        <div style="text-align:center;flex:1;padding:12px;background:#1e293b;border-radius:8px;">
          <p style="color:#64748b;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Previous Role</p>
          <p style="color:#94a3b8;font-size:16px;font-weight:600;margin:0;text-transform:capitalize;">${oldRole || "—"}</p>
        </div>
        <div style="font-size:20px;color:#475569;">→</div>
        <div style="text-align:center;flex:1;padding:12px;background:${cfg.bg};border-radius:8px;border:2px solid ${cfg.color}33;">
          <p style="color:${cfg.color};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Your New Role</p>
          <p style="font-size:24px;margin:0 0 4px;">${cfg.emoji}</p>
          <p style="color:${cfg.color};font-size:16px;font-weight:700;margin:0;">${cfg.label}</p>
        </div>
      </div>
    </div>

    <!-- Permissions -->
    <div style="padding:0 32px 24px;">
      <div style="background:#0f172a;border-left:4px solid ${cfg.color};border-radius:8px;padding:16px 20px;">
        <p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">What you can do</p>
        <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;">${cfg.perms}</p>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="http://localhost:5173" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
        Open Kanban Workspace →
      </a>
      <p style="color:#64748b;font-size:12px;margin:16px 0 0;">
        If you have any questions, reach out to your workspace admin.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;border-top:1px solid #334155;background:#0f172a;">
      <p style="color:#475569;font-size:12px;margin:0;">© Kanban Workspace · This is an automated notification</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ── Password Reset Email ──
async function sendPasswordResetEmail({ name, email, resetUrl }) {
  await send({
    to:      email,
    subject: "Reset your Kanban password",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">Reset your password</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">
        We received a request to reset your Kanban Workspace password. Click the button below to set a new password.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="background:#3b82f6;color:#fff;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;display:inline-block;">
          Reset Password →
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
    <div style="padding:20px;text-align:center;border-top:1px solid #334155;">
      <p style="color:#475569;font-size:12px;margin:0;">© Kanban Workspace</p>
    </div>
  </div>
</body>
</html>`,
  });
}

module.exports = { sendOtpEmail, sendRoleAssignmentEmail, sendPasswordResetEmail };