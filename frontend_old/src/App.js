import React, { useEffect, useState } from "react";
import { getAllTasks, updateTask } from "./api/taskApi";
import Column from "./components/Column";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await getAllTasks();
    setTasks(response.data);
  };

  const handleMove = async (task, newStatus) => {
    await updateTask(task.task_id, { status: newStatus });
    fetchTasks();
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.task_id === active.id);
    if (!activeTask) return;

    // If dropped in a different column
    const columnMap = { Todo: "Todo", "In Progress": "In Progress", Done: "Done" };
    const targetTask = tasks.find((t) => t.task_id === over.id);
    if (targetTask && activeTask.status !== targetTask.status) {
      await handleMove(activeTask, targetTask.status);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-5 p-10 bg-gray-100 min-h-screen">
        <Column
          title="Todo"
          tasks={tasks.filter((t) => t.status === "Todo")}
          onMove={(t) => handleMove(t, "In Progress")}
          columnId="Todo"
        />
        <Column
          title="In Progress"
          tasks={tasks.filter((t) => t.status === "In Progress")}
          onMove={(t) => handleMove(t, "Done")}
          columnId="In Progress"
        />
        <Column
          title="Completed"
          tasks={tasks.filter((t) => t.status === "Done")}
          onMove={null}
          columnId="Done"
        />
      </div>
    </DndContext>
  );
}

export default App;
