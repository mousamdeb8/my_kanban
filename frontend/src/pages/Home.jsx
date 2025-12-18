import { useState, useEffect } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import toast, { Toaster } from "react-hot-toast";

import Column from "../components/Column";
import CreateTaskModal from "../components/createTaskModal";
import EditTaskModal from "../components/EditTaskModal";

export default function Home() {
  const sensors = useSensors(useSensor(PointerSensor));

  const [tasks, setTasks] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const columns = [
    { id: "todo", name: "TODO" },
    { id: "inprogress", name: "IN PROGRESS" },
    { id: "done", name: "DONE" },
  ];

  const getStatusLabel = (status) => {
    switch (status) {
      case "todo": return "To Do";
      case "inprogress": return "In Progress";
      case "done": return "Done";
      default: return "";
    }
  };

  // 🔹 LOAD TASKS (with user info)
  const loadTasks = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/tasks", {
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // DRAG & DROP HANDLER
  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;

    const taskId = active.id;
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    let newStatus = over.id;
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) newStatus = overTask.status;

    if (draggedTask.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(
        `http://localhost:8000/api/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) toast.success(`Task moved to ${getStatusLabel(newStatus)}`);
      else { toast.error("Task not able to move"); loadTasks(); }
    } catch {
      toast.error("Task not able to move");
      loadTasks();
    }
  };

  // CREATE TASK
  const handleCreateTask = async (task) => {
    try {
      const res = await fetch("http://localhost:8000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, newTask]);
        toast.success("Task created successfully");
      } else toast.error("Task not able to create");
    } catch {
      toast.error("Task not able to create");
    }
  };

  // UPDATE TASK
  const handleUpdateTask = async (task) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        setEditTask(null);
        toast.success("Task updated successfully");
      } else toast.error("Task not able to update");
    } catch {
      toast.error("Task not able to update");
    }
  };

  // DELETE TASK
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setEditTask(null);
        toast.success("Task deleted successfully");
      } else toast.error("Task not able to delete");
    } catch {
      toast.error("Task not able to delete");
    }
  };

  return (
    <>
      <Toaster position="top-right" />

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
              // 🔹 Only change: map user.name safely
              tasks={tasks
                .filter((t) => t.status === col.id)
                .map((t) => ({
                  ...t,
                  assigneeName: t.user?.name || "Unassigned",
                }))}
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
