import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

export default function Column({ id, name, tasks, onEditTask, onCreateTask }) {
  const { setNodeRef } = useDroppable({ id });

  const headerColors = {
    todo: "border-t-blue-500",
    inprogress: "border-t-yellow-500",
    inreview: "border-t-purple-500",
    done: "border-t-green-500",
  };

  const dotColors = {
    todo: "bg-blue-500",
    inprogress: "bg-yellow-500",
    inreview: "bg-purple-500",
    done: "bg-green-500",
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-72 bg-[#f4f5f7] rounded-sm border-t-[3px] ${headerColors[id]} flex flex-col h-[80vh]`}
    >
      {/* Column Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColors[id]}`} />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            {name}
          </span>
          <span className="text-xs font-semibold text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 text-lg leading-none">+</button>
      </div>

      {/* Cards */}
      <div className="px-2 pb-2 flex-1 overflow-y-auto">
        <SortableContext
          items={tasks?.map((t) => t.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-xs italic px-2 py-3">No tasks</p>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assigneeName={task.assigneeName || "Unassigned"}
                  onClick={() => onEditTask(task)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>

      {/* + Create at bottom */}
      <button
        onClick={() => onCreateTask && onCreateTask(id)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 transition-colors rounded-b-sm"
      >
        <span className="text-base leading-none">+</span>
        <span>Create issue</span>
      </button>
    </div>
  );
}