import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  const dueDateColor = () => {
    if (!task.dueDate) return "bg-gray-100 text-gray-700";
    const today = new Date();
    const due = new Date(task.dueDate);

    if (due < today) return "bg-red-100 text-red-700";
    if ((due - today) / (1000 * 60 * 60 * 24) <= 2)
      return "bg-yellow-100 text-yellow-700";

    return "bg-green-100 text-green-700";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={onClick}   // <-- Always opens edit modal
      className="cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-md border border-gray-200 relative select-none"
    >
      {/* Disable all inner pointer events so double-click works anywhere */}
      <div className="pointer-events-none">
        {/* Priority + Due Date */}
        <div className="flex justify-between mb-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              priorityColors[task.priority] || ""
            }`}
          >
            {task.priority}
          </span>

          {task.dueDate && (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${dueDateColor()}`}
            >
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-gray-800">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
        )}

        {/* Tag */}
        {task.tag && (
          <div className="mt-2">
            <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
              {task.tag}
            </span>
          </div>
        )}

        {/* Attachments */}
        {task.attachments?.length > 0 && (
          <div className="mt-2 text-xs text-blue-700">
            📎 {task.attachments.length} attachment
            {task.attachments.length > 1 ? "s" : ""}
          </div>
        )}

        {/* Assignee */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">
            {task.assignee ? task.assignee[0].toUpperCase() : "U"}
          </div>

          <span className="text-gray-700 text-sm">
            {task.assignee || "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );
}
