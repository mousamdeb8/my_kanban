/**
 * Email Service — Kanban Workspace
 * Uses SendGrid (no IPv6 issues on Render!)
 * Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in environment variables
 */

let sgMail = null;

try {
  sgMail = require('@sendgrid/mail');
  
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("📧 SendGrid email service ready");
  } else {
    console.log("📧 Email service: SENDGRID_API_KEY not configured");
    sgMail = null;
  }
} catch (e) {
  console.warn("📧 @sendgrid/mail not installed:", e.message);
  sgMail = null;
}

async function send({ to, subject, html }) {
  if (!sgMail || !process.env.SENDGRID_API_KEY) {
    console.log(`📧 [DEV MODE] Email service not configured - would send to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to enable email delivery`);
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@kanban.com';
  
  try {
    await sgMail.send({
      to,
      from: {
        email: fromEmail,
        name: 'Kanban Workspace'
      },
      subject,
      html,
    });
    console.log(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
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

async function sendRoleAssignmentEmail({ name, email, role, oldRole, adminName }) {
  const ROLE_CONFIG = {
    admin:     { emoji: "👑", color: "#ef4444", label: "Administrator",  perms: "Full access — manage projects, teams, and all workspace settings." },
    developer: { emoji: "💻", color: "#8b5cf6", label: "Developer",       perms: "Create and edit tasks, assign work, and review team submissions." },
    member:    { emoji: "👤", color: "#3b82f6", label: "Member",           perms: "View all tasks and update your own task statuses." },
    intern:    { emoji: "🌱", color: "#22c55e", label: "Intern",            perms: "View tasks and create your own tasks. Your work will be reviewed by a developer." },
  };
  const cfg = ROLE_CONFIG[role.toLowerCase()] || ROLE_CONFIG.member;
  const appUrl = process.env.FRONTEND_URL || "https://my-kanban-frontend.onrender.com";

  await send({
    to:      email,
    subject: `${cfg.emoji} Your Kanban role has been updated — you're now a ${cfg.label}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:36px 32px;text-align:center;">
      <h1 style="color:#fff;font-size:24px;margin:0;font-weight:700;">Role Updated!</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:8px 0 0;">Your access level has changed</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong> 👋</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#cbd5e1;">${adminName}</strong> has updated your role to <strong style="color:${cfg.color};">${cfg.emoji} ${cfg.label}</strong>.
      </p>
      <div style="background:#0f172a;border-left:4px solid ${cfg.color};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">What you can do</p>
        <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;">${cfg.perms}</p>
      </div>
      <div style="text-align:center;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
          Open Kanban Workspace →
        </a>
      </div>
    </div>
    <div style="padding:20px 32px;text-align:center;border-top:1px solid #334155;background:#0f172a;">
      <p style="color:#475569;font-size:12px;margin:0;">© Kanban Workspace · This is an automated notification</p>
    </div>
  </div>
</body>
</html>`,
  });
}

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
        Click the button below to reset your Kanban Workspace password.
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