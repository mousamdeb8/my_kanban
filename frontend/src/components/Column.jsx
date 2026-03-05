import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

const COUNT_COLORS = {
  todo:       "bg-blue-100 text-blue-700",
  inprogress: "bg-yellow-100 text-yellow-700",
  inreview:   "bg-purple-100 text-purple-700",
  done:       "bg-green-100 text-green-700",
};

const DOT_COLORS = {
  todo:       "bg-blue-500",
  inprogress: "bg-yellow-500",
  inreview:   "bg-purple-500",
  done:       "bg-green-500",
};

export default function Column({ id, name, tasks, canCreate, onEditTask, onQuickCreate }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all ${
      isOver
        ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
    }`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${DOT_COLORS[id]}`}/>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-widest uppercase">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${COUNT_COLORS[id]}`}>{tasks.length}</span>
          {canCreate && (
            <button onClick={onQuickCreate}
              className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-sm font-bold">
              +
            </button>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div ref={setNodeRef} className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-gray-300 dark:text-gray-600">
              <p className="text-xs">No tasks</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={task.assigneeName || "Unassigned"}
                onClick={() => onEditTask(task)}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Quick create footer */}
      {canCreate && (
        <button onClick={onQuickCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-bold">+</span> Create issue
        </button>
      )}
    </div>
  );
}