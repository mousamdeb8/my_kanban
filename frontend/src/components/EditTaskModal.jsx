import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TASK_TYPES = [
  { value: "task",    label: "Task",    emoji: "✅" },
  { value: "bug",     label: "Bug",     emoji: "🐛" },
  { value: "request", label: "Request", emoji: "💬" },
  { value: "epic",    label: "Epic",    emoji: "⚡" },
];
const PRIORITY_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#3b82f6" };
const STATUS_OPTIONS = [
  { value: "todo",       label: "To Do",      color: "#3b82f6" },
  { value: "inprogress", label: "In Progress", color: "#f59e0b" },
  { value: "inreview",   label: "In Review",   color: "#8b5cf6" },
  { value: "done",       label: "Done",        color: "#22c55e" },
];
const VERDICTS = [
  { value: "approved",  label: "Approved",          icon: "✅", color: "text-green-700", bg: "bg-green-50",  border: "border-green-400", btn: "bg-green-600 hover:bg-green-700",  desc: "Work is correct" },
  { value: "partial",   label: "Partially Correct",  icon: "🔶", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-400", btn: "bg-amber-500 hover:bg-amber-600",  desc: "Minor fixes needed" },
  { value: "needs_fix", label: "Needs Fix",           icon: "❌", color: "text-red-700",   bg: "bg-red-50",    border: "border-red-400",   btn: "bg-red-600 hover:bg-red-700",      desc: "Must redo with deadline" },
];
const ROLE_BADGE = {
  admin:     "bg-red-100 text-red-700",
  developer: "bg-purple-100 text-purple-700",
  member:    "bg-blue-100 text-blue-700",
  intern:    "bg-green-100 text-green-700",
};

function stringToColor(str) {
  str = str || "";
  const c = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return fmtDate(iso);
}

function AvatarPill({ u, tint }) {
  tint = tint || "blue";
  if (!u) return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px]">?</div>
      <p className="text-[10px] text-gray-400">Not selected</p>
    </div>
  );
  return (
    <div className={"flex items-center gap-2 px-2 py-1.5 rounded-lg bg-" + tint + "-50 dark:bg-" + tint + "-900/20"}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: stringToColor(u.name) }}>
        {u.name ? u.name[0].toUpperCase() : "?"}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-800 dark:text-white truncate">{u.name}</p>
        <span className={"text-[9px] font-semibold capitalize px-1 rounded " + (ROLE_BADGE[(u.role || "").toLowerCase()] || "bg-gray-100 text-gray-600")}>{u.role}</span>
      </div>
    </div>
  );
}

export default function EditTaskModal({ task, token, user, canEdit, canDelete, onClose, onUpdate, onReviewed, onDelete }) {
  const [taskType,     setTaskType]     = useState(task.taskType || task.type || "task");
  const [title,        setTitle]        = useState(task.title || "");
  const [description,  setDescription]  = useState(task.description || "");
  const [priority,     setPriority]     = useState(task.priority || "Medium");
  const [status,       setStatus]       = useState(task.status || "todo");
  const [dueDate,      setDueDate]      = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
  const [tag,          setTag]          = useState(task.tag || "");
  const [assignedById, setAssignedById] = useState("");
  const [assignToId,   setAssignToId]   = useState(task.user && task.user.id ? String(task.user.id) : "");
  const [allUsers,     setAllUsers]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);

  // Review state
  const [reviews,          setReviews]          = useState([]);
  const [reviewsLoaded,    setReviewsLoaded]    = useState(false);
  const [verdict,          setVerdict]          = useState("");
  const [comment,          setComment]          = useState("");
  const [fixDueDate,       setFixDueDate]       = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab,        setActiveTab]        = useState("details");

  const myRole       = (user && user.role ? user.role : "").toLowerCase();
  const isMember     = myRole === "member";
  const isIntern     = myRole === "intern";
  const isAdminOrDev = myRole === "admin" || myRole === "developer";
  const isAdmin      = myRole === "admin";
  const isDeveloper  = myRole === "developer";

  const isDone       = task.status === "done";
  const wasReviewed  = !!task.reviewVerdict;
  const isAssigner   = isAdmin || (isDeveloper && task.assignedById && String(task.assignedById) === String(user && user.id));

  // Show review tab: task is done (can submit), OR has history (view only)
  const canReview       = isAdminOrDev && isAssigner && (isDone || wasReviewed);
  const canSubmitReview = isDone && isAdminOrDev && isAssigner;

  const hdrs = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  useEffect(() => {
    if (!token) return;
    fetch(API + "/api/users/assignable?project_id=" + task.project_id, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return;
        setAllUsers(d);
        const me = d.find(u2 => u2.email && user && u2.email.toLowerCase() === user.email.toLowerCase());
        if (me) setAssignedById(String(me.id));
        if (task.user && task.user.id) setAssignToId(String(task.user.id));
      })
      .catch(() => {});
  }, [task.project_id, token]);

  useEffect(() => {
    if (!canReview || reviewsLoaded) return;
    fetch(API + "/api/tasks/" + task.id + "/reviews", { headers: hdrs })
      .then(r => r.json())
      .then(d => { setReviews(Array.isArray(d) ? d : []); setReviewsLoaded(true); })
      .catch(() => setReviewsLoaded(true));
  }, [canReview, task.id]);

  useEffect(() => {
    if (canSubmitReview || (canReview && wasReviewed)) setActiveTab("review");
  }, [canSubmitReview, canReview, wasReviewed]);

  const assignerOptions  = allUsers.filter(u2 => ["admin","developer"].includes((u2.role || "").toLowerCase()));
  const assigneeOptions  = allUsers;
  const selectedType     = TASK_TYPES.find(t => t.value === taskType) || TASK_TYPES[0];
  const selectedAssigner = allUsers.find(u2 => String(u2.id) === assignedById);
  const selectedAssignee = allUsers.find(u2 => String(u2.id) === assignToId);
  const totalRejections  = reviews.filter(r => r.verdict === "needs_fix" || r.verdict === "partial").length;
  const sv               = VERDICTS.find(v => v.value === verdict);

  const handleSaveTask = async () => {
    if (!title.trim()) return toast.error("Title required");
    setLoading(true);
    try {
      await onUpdate({
        ...task,
        title:       title.trim(),
        description: description.trim() || null,
        priority, status,
        dueDate:  dueDate || null,
        tag:      tag.trim() || null,
        taskType,
        user_id:  isAdminOrDev ? (Number(assignToId) || null) : task.user_id,
      });
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try { await onDelete(task.id); } finally { setLoading(false); }
  };

  const handleStatusOnly = async (newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(API + "/api/tasks/" + task.id + "/status", {
        method: "PATCH", headers: hdrs,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success("Status updated!"); onUpdate({ ...task, status: newStatus }); onClose(); }
      else { const d = await res.json(); toast.error(d.message || "Failed"); }
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!verdict)        return toast.error("Select a verdict");
    if (!comment.trim()) return toast.error("Comment is required");
    if ((verdict === "needs_fix" || verdict === "partial") && !fixDueDate)
      return toast.error("Set a fix deadline for the intern");
    setSubmittingReview(true);
    try {
      const res = await fetch(API + "/api/tasks/" + task.id + "/review", {
        method: "POST", headers: hdrs,
        body: JSON.stringify({ verdict, comment: comment.trim(), fixDueDate: fixDueDate || null, originalDueDate: task.dueDate || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const msgs = {
          approved:  "✅ Approved — great work marked!",
          partial:   "🔶 Sent back for minor fixes",
          needs_fix: "❌ Sent back to To Do for rework",
        };
        toast.success(msgs[verdict] || "Review submitted!");
        if (onReviewed) onReviewed(data);
        else onUpdate(data);
        onClose();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch { toast.error("Failed"); }
    finally { setSubmittingReview(false); }
  };

  const headerTitle = title.trim() || task.title || "Edit Task";
  const headerSub   = selectedType.emoji + " " + selectedType.label + " · KAN-" + task.id + " · " + priority;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: PRIORITY_COLORS[priority] + "18", border: "1.5px solid " + PRIORITY_COLORS[priority] + "44" }}>
            {selectedType.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 dark:text-white truncate">{headerTitle}</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{headerSub}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 text-xl flex-shrink-0">✕</button>
        </div>

        {/* Tabs */}
        {canReview && (
          <div className="flex border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button onClick={() => setActiveTab("details")}
              className={"flex-1 py-2.5 text-xs font-semibold transition-colors " + (activeTab === "details" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-400 hover:text-gray-600")}>
              📝 Task Details
            </button>
            <button onClick={() => setActiveTab("review")}
              className={"flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 " + (activeTab === "review" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-400 hover:text-gray-600")}>
              🔍 Review Work
              {totalRejections > 0 && (
                <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{totalRejections} rejected</span>
              )}
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── REVIEW TAB ── */}
          {activeTab === "review" && canReview && (
            <>
              {/* Past review history */}
              {reviews.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Review History ({reviews.length})</p>
                    {totalRejections > 0 && (
                      <span className="text-[10px] font-bold text-red-500">{"⚠️ " + totalRejections + " rejection" + (totalRejections > 1 ? "s" : "")}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {reviews.map(function(r) {
                      const vm = VERDICTS.find(v => v.value === r.verdict) || VERDICTS[0];
                      const isRejection = r.verdict === "needs_fix" || r.verdict === "partial";
                      return (
                        <div key={r.id} className={"rounded-xl border overflow-hidden " + vm.bg + " " + vm.border}>
                          <div className="px-3 py-2 flex items-center justify-between border-b border-black/5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{vm.icon}</span>
                              <span className={"text-[10px] font-bold " + vm.color}>{vm.label}</span>
                              {isRejection && r.rejectionNumber && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-red-200 text-red-700 rounded-full font-bold">Rejection #{r.rejectionNumber}</span>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</p>
                              <p className="text-[9px] text-gray-400">by {r.reviewerName}</p>
                            </div>
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{r.comment}</p>
                          </div>
                          {isRejection && (
                            <div className="px-3 py-2 bg-black/5 border-t border-black/5 grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Original Deadline</p>
                                <p className="text-[10px] text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                                  {r.originalDueDate ? "📅 " + fmtDate(r.originalDueDate) : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">New Fix Deadline</p>
                                <p className={"text-[10px] font-bold mt-0.5 " + (r.fixDueDate ? "text-red-600" : "text-gray-400 italic")}>
                                  {r.fixDueDate ? "🔴 " + fmtDate(r.fixDueDate) : "Not set"}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sent Back To</p>
                                <p className="text-[10px] font-bold mt-0.5">
                                  {r.verdict === "needs_fix"
                                    ? <span className="text-orange-600">📌 To Do — must restart</span>
                                    : <span className="text-amber-600">🔄 In Progress — fix and resubmit</span>}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New review form — only when task is Done */}
              {canSubmitReview && (
                <>
                  <div className={reviews.length > 0 ? "border-t border-gray-100 dark:border-gray-700 pt-4" : ""}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Submit Review *</p>
                    <div className="grid grid-cols-3 gap-2">
                      {VERDICTS.map(v => (
                        <button key={v.value} onClick={() => setVerdict(v.value)}
                          className={"flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all " + (verdict === v.value ? v.bg + " " + v.border + " " + v.color : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300")}>
                          <span className="text-2xl">{v.icon}</span>
                          <p className={"text-[10px] font-bold text-center " + (verdict === v.value ? v.color : "text-gray-700 dark:text-gray-200")}>{v.label}</p>
                          <p className={"text-[9px] text-center leading-tight " + (verdict === v.value ? v.color + " opacity-80" : "text-gray-400")}>{v.desc}</p>
                          {verdict === v.value && <span className="text-[9px] font-semibold">✓ Selected</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Review Comment *</label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                      placeholder={
                        verdict === "approved"  ? "Describe what was done well..." :
                        verdict === "needs_fix" ? "Describe exactly what needs to be fixed..." :
                        verdict === "partial"   ? "Describe what is correct and what needs improvement..." :
                        "Select a verdict, then write your detailed feedback..."
                      }
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
                  </div>

                  {(verdict === "needs_fix" || verdict === "partial") && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
                      <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 flex gap-6">
                        {task.dueDate && (
                          <div>
                            <p className="text-[9px] font-bold text-gray-500 uppercase">Original Deadline</p>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">{"📅 " + fmtDate(task.dueDate)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] font-bold text-red-500 uppercase">New Fix Deadline *</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {verdict === "needs_fix" ? "Task goes back to To Do" : "Task goes back to In Progress"}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-white dark:bg-gray-800">
                        <input type="date" value={fixDueDate} onChange={e => setFixDueDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full border border-red-200 dark:border-red-700 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"/>
                        <p className="text-[10px] text-amber-600 mt-1.5">
                          {verdict === "needs_fix"
                            ? "⚠️ Task moves to To Do — intern must restart"
                            : "⚠️ Task moves to In Progress — intern fixes and resubmits"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Read-only notice when not done */}
              {!canSubmitReview && reviews.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No review history yet.</div>
              )}
            </>
          )}

          {/* ── DETAILS TAB ── */}
          {(activeTab === "details" || !canReview) && (
            <>
              {/* MEMBER: read-only + status */}
              {isMember && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{description || <span className="italic text-gray-400">No description</span>}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Priority</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: PRIORITY_COLORS[priority] }}>{priority}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-300">{dueDate || "—"}</p>
                      </div>
                      {tag && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tag</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 rounded-full">{"#" + tag}</span>
                        </div>
                      )}
                    </div>
                    {task.user && task.user.name && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Assigned To</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{task.user.name}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s.value} onClick={() => handleStatusOnly(s.value)} disabled={loading}
                          className="py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all"
                          style={status === s.value
                            ? { background: s.color, borderColor: s.color, color: "#fff" }
                            : { background: "#f9fafb", color: "#6b7280", borderColor: "#e5e7eb" }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">ℹ️ Members can only update status.</p>
                  </div>
                </>
              )}

              {/* INTERN: read-only for others' tasks */}
              {isIntern && !canEdit && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-200">{description || <span className="italic text-gray-400">No description</span>}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100">
                    <p className="text-xs text-green-600 font-medium">🌱 You can only edit tasks assigned to you.</p>
                  </div>
                </>
              )}

              {/* FULL EDIT: admin, developer, intern (own tasks) */}
              {canEdit && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Task Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {TASK_TYPES.map(t => (
                        <button key={t.value} onClick={() => setTaskType(t.value)}
                          className={"flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all " + (taskType === t.value ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700" : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100")}>
                          <span className="text-xl">{t.emoji}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                      placeholder="Add a description..."
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Priority</label>
                      <div className="flex gap-1">
                        {["High","Medium","Low"].map(p => (
                          <button key={p} onClick={() => setPriority(p)}
                            className="flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all"
                            style={priority === p
                              ? { background: PRIORITY_COLORS[p], color: "#fff", borderColor: PRIORITY_COLORS[p] }
                              : { background: "#f9fafb", color: "#6b7280", borderColor: "#e5e7eb" }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Due Date</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tag</label>
                      <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. bug, feature"
                        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"/>
                    </div>
                  </div>

                  {isAdminOrDev && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1">Assigned By</span>
                        <span className="text-gray-300 px-3">→</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1 text-right">Assign To</span>
                      </div>
                      <div className="flex items-stretch bg-white dark:bg-gray-800">
                        <div className="flex-1 px-3 py-3 border-r border-gray-100 dark:border-gray-700">
                          <select value={assignedById} onChange={e => setAssignedById(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 mb-2">
                            <option value="">Select assigner...</option>
                            {assignerOptions.map(u2 => <option key={u2.id} value={u2.id}>{u2.name} · {u2.role}</option>)}
                          </select>
                          <AvatarPill u={selectedAssigner} tint="blue"/>
                        </div>
                        <div className="flex items-center px-2 text-gray-300 text-lg flex-shrink-0">→</div>
                        <div className="flex-1 px-3 py-3">
                          <select value={assignToId} onChange={e => setAssignToId(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 mb-2">
                            <option value="">Unassigned</option>
                            {assigneeOptions.map(u2 => <option key={u2.id} value={u2.id}>{u2.name} ({u2.role})</option>)}
                          </select>
                          <AvatarPill u={selectedAssignee} tint="green"/>
                        </div>
                      </div>
                      {selectedAssignee && (
                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100">
                          <p className="text-[10px] text-amber-600 font-medium">🔔 {selectedAssignee.name} will be notified</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between flex-shrink-0">
          <div>
            {canDelete && !confirmDel && (
              <button onClick={() => setConfirmDel(true)} className="text-xs text-red-500 hover:text-red-700 font-medium">🗑️ Delete task</button>
            )}
            {canDelete && confirmDel && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Delete?</span>
                <button onClick={handleDelete} disabled={loading} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">Yes</button>
                <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-600 text-xs font-bold rounded-lg">No</button>
              </div>
            )}
            {activeTab === "review" && canReview && totalRejections > 0 && (
              <span className="text-[10px] text-red-500 font-semibold">{totalRejections + " rejection" + (totalRejections > 1 ? "s" : "") + " on record"}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-700">
              {isMember || (isIntern && !canEdit) ? "Close" : "Cancel"}
            </button>
            {activeTab === "review" && canSubmitReview && (
              <button onClick={handleSubmitReview} disabled={submittingReview || !verdict || !comment.trim()}
                className={"px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-40 flex items-center gap-2 " + (sv ? sv.btn : "bg-blue-600 hover:bg-blue-700")}>
                {submittingReview
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting...</>
                  : sv ? "Submit " + sv.icon + " " + sv.label : "Submit Review"}
              </button>
            )}
            {activeTab === "review" && canReview && !canSubmitReview && (
              <span className="text-xs text-gray-400 italic">Move task to Done to submit a review</span>
            )}
            {activeTab === "details" && canEdit && (
              <button onClick={handleSaveTask} disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow disabled:opacity-50 flex items-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : "Save Changes"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}