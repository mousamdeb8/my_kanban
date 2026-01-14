import { useEffect, useMemo, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /* Status helpers */
  const isDone = task.status === "done";

  const isOverdue = useMemo(() => {
    if (!task.dueDate || isDone) return false;

    const today = new Date();
    const due = new Date(task.dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due < today;
  }, [task.dueDate, isDone]);

  /* Due date countdown  */
  const dueCountdown = () => {
    if (!task.dueDate || isDone) return null;

    const today = new Date();
    const due = new Date(task.dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due today";
    return `${diff} day${diff > 1 ? "s" : ""} left`;
  };

  /* Overdue toast only once */
  const toastShown = useRef(false);

  useEffect(() => {
    if (isOverdue && !toastShown.current) {
      toast.error(`⚠️ Task overdue: ${task.title}`);
      toastShown.current = true;
    }

    // reset if task is completed
    if (isDone) toastShown.current = true;
  }, [isOverdue, isDone, task.title]);

  const priorityColors = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  const assigneeName =
    task.user?.name || task.assignee || "Unassigned";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={onClick}
      className={`
        cursor-pointer p-4 rounded-xl shadow border select-none
        ${
          isDone
            ? "bg-green-50 border-green-500"
            : isOverdue
            ? "bg-red-50 border-red-500"
            : "bg-white border-gray-200"
        }
      `}
    >
      <div className="pointer-events-none">
        {/* Priority & Date */}
        <div className="flex justify-between mb-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority}
          </span>

          {/* Right side status */}
          <div className="text-right text-xs">
            {isDone ? (
              <>
                {/* ✅ Completed */}
                <div className="flex items-center gap-1 font-semibold text-green-700">
                  <span>✔</span>
                  <span>Completed</span>
                </div>
                <div className="text-[10px] text-green-600">
                  {task.updatedAt
                    ? new Date(task.updatedAt).toLocaleDateString()
                    : ""}
                </div>
              </>
            ) : (
              task.dueDate && (
                <>
                  <div className="flex items-center gap-1 font-semibold">
                    <span>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    {isOverdue && <span className="text-red-600">⚠️</span>}
                  </div>
                  <div
                    className={`text-[10px] ${
                      isOverdue ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {dueCountdown()}
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-800">{task.title}</h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-500 mt-1">
            {task.description}
          </p>
        )}

        {/* Assignee */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">
            {assigneeName[0]?.toUpperCase()}
          </div>
          <span className="text-gray-700 text-sm">
            {assigneeName}
          </span>
        </div>
      </div>
    </div>
  );
}
