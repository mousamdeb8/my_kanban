import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API = "http://localhost:8000";

const VERDICTS = [
  { value: "approved",  label: "Approved",          icon: "✅", color: "text-green-700", bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-400",  btn: "bg-green-600 hover:bg-green-700",  desc: "Work is complete and correct"            },
  { value: "partial",   label: "Partially Correct",  icon: "🔶", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-900/20",   border: "border-amber-400",  btn: "bg-amber-500 hover:bg-amber-600",  desc: "Mostly done, minor fixes needed"          },
  { value: "needs_fix", label: "Needs Fix",           icon: "❌", color: "text-red-700",   bg: "bg-red-50 dark:bg-red-900/20",       border: "border-red-400",    btn: "bg-red-600 hover:bg-red-700",      desc: "Incorrect — must redo with new deadline"  },
];

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TaskReviewPanel({ task, token, user, onReviewed, onClose }) {
  const [reviews,      setReviews]      = useState([]);
  const [verdict,      setVerdict]      = useState("");
  const [comment,      setComment]      = useState("");
  const [fixDueDate,   setFixDueDate]   = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [loading,      setLoading]      = useState(true);

  const canReview = ["admin","developer"].includes((user?.role||"").toLowerCase());
  const headers   = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/api/tasks/${task.id}/reviews`, { headers })
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [task.id]);

  const totalRejections = reviews.filter(r => r.verdict === "needs_fix" || r.verdict === "partial").length;

  const handleSubmit = async () => {
    if (!verdict)        return toast.error("Select a verdict");
    if (!comment.trim()) return toast.error("Comment is required");
    if ((verdict === "needs_fix" || verdict === "partial") && !fixDueDate)
      return toast.error("Please set a fix deadline for the intern");

    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/api/tasks/${task.id}/review`, {
        method: "POST", headers,
        body: JSON.stringify({
          verdict,
          comment:      comment.trim(),
          fixDueDate:   fixDueDate || null,
          originalDueDate: task.dueDate || null,
        }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Review submitted!"); onReviewed(data); onClose(); }
      else        { toast.error(data.message || "Failed"); }
    } catch { toast.error("Failed to submit"); }
    setSubmitting(false);
  };

  const sv = VERDICTS.find(v => v.value === verdict);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">🔍</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white truncate">Review: {task.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-gray-400">
                Assigned to <span className="font-semibold text-gray-600 dark:text-gray-300">{task.user?.name || "Unknown"}</span>
                {task.user?.role && <span className="ml-1 capitalize text-gray-400">· {task.user.role}</span>}
              </p>
              {totalRejections > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">
                  {totalRejections} rejection{totalRejections > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 text-xl flex-shrink-0">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── Review History ── */}
          {!loading && reviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Review History ({reviews.length})
                </p>
                {totalRejections > 0 && (
                  <span className="text-[10px] font-semibold text-red-500">
                    ⚠️ {totalRejections} time{totalRejections > 1 ? "s" : ""} rejected
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {reviews.map((r, idx) => {
                  const vm = VERDICTS.find(v => v.value === r.verdict) || VERDICTS[0];
                  const isRejection = r.verdict === "needs_fix" || r.verdict === "partial";
                  return (
                    <div key={r.id} className={`rounded-xl border overflow-hidden ${vm.bg} ${vm.border}`}>
                      {/* Review header */}
                      <div className="px-3 py-2 flex items-center justify-between border-b border-black/5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{vm.icon}</span>
                          <span className={`text-[10px] font-bold uppercase ${vm.color}`}>{vm.label}</span>
                          {isRejection && r.rejectionNumber && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-red-200 text-red-700 rounded-full font-bold">
                              Rejection #{r.rejectionNumber}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">by {r.reviewerName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                      </div>

                      {/* Comment */}
                      <div className="px-3 py-2">
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{r.comment}</p>
                      </div>

                      {/* Dates — show both original and fix deadline for rejections */}
                      {isRejection && (
                        <div className="px-3 py-2 bg-black/5 flex gap-4 border-t border-black/5">
                          {r.originalDueDate && (
                            <div>
                              <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Original Deadline</p>
                              <p className="text-[10px] text-gray-600 font-medium mt-0.5">📅 {fmtDate(r.originalDueDate)}</p>
                            </div>
                          )}
                          {r.fixDueDate && (
                            <div>
                              <p className="text-[9px] font-semibold text-red-500 uppercase tracking-wider">New Fix Deadline</p>
                              <p className="text-[10px] text-red-600 font-bold mt-0.5">🔴 {fmtDate(r.fixDueDate)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}

          {/* ── New Review Form ── */}
          {canReview ? (
            <>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {reviews.length > 0 ? "Submit New Review" : "Your Verdict *"}
                </p>

                {/* Three verdict cards */}
                <div className="grid grid-cols-3 gap-2">
                  {VERDICTS.map(v => (
                    <button key={v.value} onClick={() => setVerdict(v.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        verdict === v.value
                          ? `${v.bg} ${v.border} ${v.color}`
                          : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300"
                      }`}>
                      <span className="text-2xl">{v.icon}</span>
                      <div className="text-center">
                        <p className={`text-[10px] font-bold ${verdict === v.value ? v.color : "text-gray-700 dark:text-gray-200"}`}>{v.label}</p>
                        <p className={`text-[9px] mt-0.5 leading-tight ${verdict === v.value ? v.color+" opacity-80" : "text-gray-400"}`}>{v.desc}</p>
                      </div>
                      {verdict === v.value && <span className="text-[9px] font-semibold">✓ Selected</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Review Comment *</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder={
                    verdict === "approved"   ? "Great work! Describe what was done well..." :
                    verdict === "needs_fix"  ? "Describe what's wrong and what needs to be fixed..." :
                    verdict === "partial"    ? "Describe what's correct and what still needs work..." :
                    "Select a verdict above, then write your detailed feedback..."
                  }
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
                <p className="text-[10px] text-gray-400 mt-1">{comment.length}/500</p>
              </div>

              {/* Fix deadline — for needs_fix and partial */}
              {(verdict === "needs_fix" || verdict === "partial") && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
                  <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex gap-6">
                    {task.dueDate && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Original Deadline</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">📅 {fmtDate(task.dueDate)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">New Fix Deadline *</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Task will reopen with this deadline</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white dark:bg-gray-800">
                    <input type="date" value={fixDueDate} onChange={e => setFixDueDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-red-200 dark:border-red-700 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"/>
                    <p className="text-[10px] text-amber-600 mt-1.5">
                      ⚠️ This will move the task back to "In Progress" and notify the intern
                    </p>
                  </div>
                </div>
              )}

              {/* Approved confirmation */}
              {verdict === "approved" && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                    ✅ This will mark the task as <strong>approved</strong>. The intern will be notified.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
              <p className="text-sm text-gray-500">Only admins and developers can submit reviews.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {canReview && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center flex-shrink-0">
            {totalRejections > 0 && (
              <span className="text-[10px] text-red-500 font-semibold">
                {totalRejections} rejection{totalRejections > 1 ? "s" : ""} on record
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-700">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !verdict || !comment.trim()}
                className={`px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-40 flex items-center gap-2 ${sv?.btn || "bg-blue-600 hover:bg-blue-700"}`}>
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting...</>
                  : sv ? `Submit ${sv.icon} ${sv.label}` : "Submit Review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}