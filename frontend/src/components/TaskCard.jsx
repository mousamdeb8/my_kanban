import { useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskReviewPanel from "./TaskReviewPanel";

const PRIORITY_COLORS = {
  High:   "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low:    "bg-green-100 text-green-700 border-green-200",
};
const TYPE_CONFIG = {
  task:    { icon: "✅", color: "text-blue-500"   },
  bug:     { icon: "🐛", color: "text-red-500"    },
  request: { icon: "💬", color: "text-purple-500" },
  epic:    { icon: "⚡", color: "text-yellow-500" },
};

// "Mousam Deb" → "MD",  "Tarun" → "T"
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function stringToColor(str = "") {
  const c = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

function Avatar({ name, size = "w-6 h-6", fontSize = "text-[9px]", title }) {
  return (
    <div title={title || name}
      className={`${size} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-gray-800 ${fontSize}`}
      style={{ background: stringToColor(name || "?") }}>
      {getInitials(name)}
    </div>
  );
}

export default function TaskCard({ task, onClick, currentUser, token, onTaskUpdated }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const [showReview, setShowReview] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const isDone      = task.status === "done";
  const isAdminUser = currentUser?.role === "admin";
  const isDevUser   = currentUser?.role === "developer";
  // Admin: can review all done tasks. Developer: only tasks they assigned.
  const canReview   = isDone && (isAdminUser || isDevUser) && (
    isAdminUser ||
    (isDevUser && task.assignedById && String(task.assignedById) === String(currentUser?.id))
  );
  const isInternTask = (task.user?.role || "").toLowerCase() === "intern";
  const verdict     = task.reviewVerdict; // last review verdict if any
  const typeCfg     = TYPE_CONFIG[task.taskType || task.type] || TYPE_CONFIG.task;

  const isOverdue = useMemo(() => {
    if (!task.dueDate || isDone) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const due   = new Date(task.dueDate); due.setHours(0,0,0,0);
    return due < today;
  }, [task.dueDate, isDone]);

  const dueLabel = () => {
    if (!task.dueDate || isDone) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const due   = new Date(task.dueDate); due.setHours(0,0,0,0);
    const diff  = Math.ceil((due - today) / 86400000);
    if (diff < 0)  return { text: "Overdue",  color: "text-red-500"    };
    if (diff === 0) return { text: "Due today", color: "text-orange-500" };
    return { text: `${diff}d left`, color: "text-gray-400" };
  };
  const due      = dueLabel();
  const assignee = task.user?.name || task.assigneeName || "Unassigned";

  // Verdict badge config
  const VERDICT_STYLE = {
    approved:  { icon: "✅", text: "Approved",   color: "text-green-600", bg: "bg-green-50"  },
    partial:   { icon: "🔶", text: "Partial",     color: "text-amber-600", bg: "bg-amber-50"  },
    needs_fix: { icon: "❌", text: "Needs Fix",   color: "text-red-600",   bg: "bg-red-50"    },
  };
  const vs = verdict ? VERDICT_STYLE[verdict] : null;

  return (
    <>
      {showReview && (
        <TaskReviewPanel
          task={task}
          token={token}
          user={currentUser}
          onReviewed={(updated) => { if (onTaskUpdated) onTaskUpdated(updated); }}
          onClose={() => setShowReview(false)}
        />
      )}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onDoubleClick={onClick}
        className={`cursor-pointer select-none rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all group ${
          isDone    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" :
          isOverdue ? "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700" :
                      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300"
        }`}
      >
        <div className="pointer-events-none">

          {/* Top row: type icon + priority + due */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm ${typeCfg.color}`} title={task.taskType || task.type}>{typeCfg.icon}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low}`}>
                {task.priority}
              </span>
            </div>
            <div className="text-right">
              {isDone ? (
                <span className="text-[10px] font-semibold text-green-600">✔ Done</span>
              ) : due ? (
                <div className="flex items-center gap-1">
                  {isOverdue && <span className="text-[10px]">⚠️</span>}
                  <span className={`text-[10px] font-medium ${due.color}`}>{due.text}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Title */}
          <p className="text-xs font-semibold text-gray-800 dark:text-white leading-snug mb-1 line-clamp-2">{task.title}</p>

          {/* Description */}
          {task.description && (
            <p className="text-[10px] text-gray-400 leading-snug line-clamp-2 mb-2">{task.description}</p>
          )}

          {/* Tag */}
          {task.tag && (
            <span className="inline-block text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full mb-2">
              #{task.tag}
            </span>
          )}

          {/* Review verdict badge */}
          {vs && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${vs.bg} mb-2`}>
              <span className="text-xs">{vs.icon}</span>
              <span className={`text-[10px] font-bold ${vs.color}`}>{vs.text}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <Avatar name={assignee} title={`Assigned to: ${assignee}`}/>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1.5 font-medium">{assignee}</span>
              {isInternTask && (
                <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-green-100 text-green-600 rounded-full font-semibold">intern</span>
              )}
            </div>
            {task.dueDate && !isDone && (
              <span className="text-[9px] text-gray-400">
                {new Date(task.dueDate).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
              </span>
            )}
          </div>
        </div>

        {/* ── Review buttons — visible on hover for admin/developer when intern task is done ── */}
        {canReview && (
          <div className="mt-2.5 pt-2.5 border-t border-green-200 dark:border-green-800 pointer-events-auto">
            <p className="text-[9px] text-gray-400 mb-1.5 font-medium">REVIEW INTERN WORK</p>
            <div className="flex gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); setShowReview(true); }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-all bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                title="Approve — work is correct">
                ✅ Approve
              </button>
              <button
                onClick={e => { e.stopPropagation(); setShowReview(true); }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-all bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                title="Partially correct — minor fixes needed">
                🔶 Partial
              </button>
              <button
                onClick={e => { e.stopPropagation(); setShowReview(true); }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-all bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                title="Needs fix — reopen with new deadline">
                ❌ Fix
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}