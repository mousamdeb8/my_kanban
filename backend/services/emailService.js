const nodemailer = require("nodemailer");

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your real password)
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) console.error(" Email service error:", error.message);
  else console.log(" Email service ready");
});

/**
 * Send task assignment email
 */
async function sendTaskAssignedEmail({ assigneeName, assigneeEmail, taskTitle, taskDescription, priority, dueDate, projectName, assignedBy }) {
  const dueDateStr = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })
    : "No due date set";

  const priorityColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#3b82f6" }[priority] || "#6b7280";
  const priorityIcon  = { High: "🔴", Medium: "🟡", Low: "🔵" }[priority] || "⚪";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px 40px;">
          <table width="100%"><tr>
            <td><div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:20px;font-weight:800;line-height:40px;display:block;text-align:center;">K</span>
            </div></td>
            <td style="padding-left:12px;vertical-align:middle;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Kanban Workspace</p>
              <p style="margin:2px 0 0;color:#fff;font-size:16px;font-weight:700;">${projectName}</p>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Task Assignment</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#111827;line-height:1.3;">Hi ${assigneeName}, you've been assigned a task! 👋</h1>

          <!-- Task card -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <div>
                <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e293b;">${taskTitle}</h2>
                ${taskDescription ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">${taskDescription}</p>` : ""}
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px;">
                      <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;color:${priorityColor};background:${priorityColor}18;">
                        ${priorityIcon} ${priority} Priority
                      </span>
                    </td>
                    <td>
                      <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;color:#6b7280;background:#f1f5f9;">
                        📅 ${dueDateStr}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>

          <!-- Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:12px;background:#f0fdf4;border-radius:8px;text-align:center;" width="50%">
                <p style="margin:0;font-size:11px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Assigned by</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#166534;">${assignedBy}</p>
              </td>
              <td width="16px"></td>
              <td style="padding:12px;background:#eff6ff;border-radius:8px;text-align:center;" width="50%">
                <p style="margin:0;font-size:11px;color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Project</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1d4ed8;">${projectName}</p>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
            Log in to your Kanban board to view task details, update the status, and collaborate with your team.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            This email was sent by <strong>Kanban Workspace</strong>. You're receiving this because you were assigned a task.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Kanban Workspace" <${process.env.GMAIL_USER}>`,
    to: assigneeEmail,
    subject: `New task assigned: "${taskTitle}" — ${projectName}`,
    html,
  });

  console.log(`Assignment email sent to ${assigneeEmail}`);
}

module.exports = { sendTaskAssignedEmail };