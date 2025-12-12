import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

export default function Column({ id, name, tasks, onEditTask }) {
  const { setNodeRef } = useDroppable({ id });

  const colors = {
    todo: "bg-blue-500",
    inprogress: "bg-yellow-500",
    done: "bg-green-500",
  };

  return (
    <div
      ref={setNodeRef}
      className="w-80 bg-white rounded-xl shadow overflow-hidden flex flex-col h-[80vh]" // ✅ added flex & height
    >
      <div className={`${colors[id]} text-white px-4 py-2 font-semibold`}>{name}</div>

      <div className="p-5 flex-1 overflow-y-auto"> {/* ✅ scroll + expand */}
        <SortableContext
          items={tasks?.map((t) => t.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No tasks</p>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
