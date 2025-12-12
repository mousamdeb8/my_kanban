import { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import Column from "./components/Column";
import CreateTaskModal from "./components/createTaskModal";
import EditTaskModal from "./components/EditTaskModal";

export default function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [tasks, setTasks] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const columns = [
    { id: "todo", name: "TODO" },
    { id: "inprogress", name: "IN PROGRESS" },
    { id: "done", name: "DONE" },
  ];

  // Load tasks from backend
  const loadTasks = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Drag & Drop handler
  const handleDragEnd = async ({ active, over }) => {
  if (!over) return;

  const taskId = active.id;

  // IMPORTANT: Find the column ID (container) instead of the item ID
  let newStatus = over.id;

  // If dropping on a task, use its parent column
  const overTask = tasks.find((t) => t.id === over.id);
  if (overTask) {
    newStatus = overTask.status;
  }

  // Update UI immediately
  setTasks((prev) =>
    prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
  );

  // Persist in DB
  try {
    await fetch(`http://localhost:8000/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.error("Failed to update task status:", err);
    loadTasks(); // revert if failed
  }
};


  // Create task
  const handleCreateTask = async (task) => {
  try {
    const res = await fetch("http://localhost:8000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });

    const newTask = await res.json();

    // Update UI with new task
    setTasks((prev) => [...prev, newTask]);

  } catch (err) {
    console.error("Create task failed:", err);
  }
};


  // Update task
  const handleUpdateTask = async (task) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      const updated = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      console.error("Update task failed:", err);
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete task failed:", err);
    }
  };

  return (
    <>
      <header className="w-full flex justify-between items-center p-5 bg-white shadow">
        <h1 className="text-2xl font-bold">KANBAN BOARD</h1>
        <button
          onClick={() => setOpenCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Create Task
        </button>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 p-6">
          {columns.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              name={col.name}
              tasks={tasks.filter((t) => t.status === col.id)}
              onEditTask={(task) => setEditTask(task)}
            />
          ))}
        </div>
      </DndContext>

      {openCreate && (
        <CreateTaskModal
          onClose={() => setOpenCreate(false)}
          onCreate={handleCreateTask}
        />
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </>
  );
}
