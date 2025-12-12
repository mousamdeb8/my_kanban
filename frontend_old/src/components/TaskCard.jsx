import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function TaskCard({ task, onMove }) {
  const nextStatus = {
    Todo: "In Progress",
    "In Progress": "Done",
    Done: null,
  };

  const priorityColor = {
    high: "bg-red-200 text-red-800",
    medium: "bg-orange-200 text-orange-800",
    low: "bg-green-200 text-green-800",
  };

  const { setNodeRef, listeners, attributes, transform, transition } = useSortable({
    id: task.task_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="bg-white rounded-lg shadow-md p-4 mb-3 hover:shadow-lg transition cursor-grab"
    >
      <h3 className="font-semibold text-lg">{task.title}</h3>
      <p className="text-gray-500 text-sm">{task.description}</p>

      <p className="mt-2 text-sm">
        <strong>Priority:</strong>{" "}
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor[task.priority.toLowerCase()]}`}
        >
          {task.priority}
        </span>
      </p>

      {task.tags && (
        <p className="mt-1 text-sm text-gray-600">
          <strong>Tags:</strong> {task.tags.join(", ")}
        </p>
      )}

      {/* Keep Move button as fallback */}
      {nextStatus[task.status] && (
        <button
          onClick={() => onMove(task)}
          className="mt-3 px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition text-sm"
        >
          Move →
        </button>
      )}
    </div>
  );
}

export default TaskCard;
