import { useEffect, useMemo, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDone = task.status === "done";

  const isOverdue = useMemo(() => {
    if (!task.dueDate || isDone) return false;
    const today = new Date(); const due = new Date(task.dueDate);
    today.setHours(0,0,0,0); due.setHours(0,0,0,0);
    return due < today;
  }, [task.dueDate, isDone]);

  const dueCountdown = () => {
    if (!task.dueDate || isDone) return null;
    const today = new Date(); const due = new Date(task.dueDate);
    today.setHours(0,0,0,0); due.setHours(0,0,0,0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due today";
    return `${diff}d left`;
  };

  const toastShown = useRef(false);
  useEffect(() => {
    if (isOverdue && !toastShown.current) {
      toast.error(`⚠️ Overdue: ${task.title}`);
      toastShown.current = true;
    }
    if (isDone) toastShown.current = true;
  }, [isOverdue, isDone, task.title]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const priorityConfig = {
    High:   { icon: "▲", color: "text-red-500" },
    Medium: { icon: "●", color: "text-yellow-500" },
    Low:    { icon: "▼", color: "text-blue-400" },
  };
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const assigneeName = task.user?.name || task.assignee || "Unassigned";
  const ticketId = `KAN-${task.id}`;

  return (
    // Outer div: ONLY drag listeners — no click handlers here
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative bg-white rounded shadow-sm border select-none group
        hover:shadow-md transition-shadow
        ${isOverdue ? "border-l-[3px] border-l-red-400" : "border-gray-200"}
      `}
    >
      {/* Inner div: captures double click — separate from drag */}
      <div
        className="p-3 cursor-pointer"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Title + kebab */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-medium text-gray-800 text-sm leading-snug flex-1">
            {task.title}
          </h3>

          {/* Kebab — stops propagation so it doesn't trigger drag or double click */}
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-all text-xs"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            >
              •••
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-lg shadow-lg text-xs w-36 py-1">
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onClick(); setMenuOpen(false); }}
                >
                  ✏️ Edit issue
                </button>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-red-500"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onClick(); setMenuOpen(false); }}
                >
                  🗑️ Delete issue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs mb-2 ${isOverdue ? "text-red-500" : isDone ? "text-green-600" : "text-gray-400"}`}>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
            </svg>
            <span>
              {isDone
                ? `Completed ${new Date(task.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                : `${new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${dueCountdown()}`
              }
            </span>
          </div>
        )}

        {/* Bottom: ticket ID + priority + avatar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {ticketId}
            </span>
            <span className={`text-[10px] font-semibold ${priority.color}`}>
              {priority.icon} {task.priority}
            </span>
          </div>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: stringToColor(assigneeName) }}
            title={assigneeName}
          >
            {assigneeName[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

function stringToColor(str) {
  const colors = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}