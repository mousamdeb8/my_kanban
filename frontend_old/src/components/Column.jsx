import React from "react";
import TaskCard from "./TaskCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

function Column({ title, tasks, onMove, columnId }) {
  return (
    <div className="bg-gray-200 rounded-lg p-4 flex-1 min-h-[500px]">
      <h2 className="text-center font-bold text-xl mb-4">{title}</h2>

      <SortableContext
        items={tasks.map((task) => task.task_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col">
          {tasks.length === 0 ? (
            <p className="text-gray-600 text-sm text-center">No tasks</p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
                onMove={onMove}
                columnId={columnId}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default Column;
