import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import toast, { Toaster } from "react-hot-toast";
import Column from "../components/Column";
import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";

export default function Home() {
  const { projectId } = useParams();
  const sensors = useSensors(useSensor(PointerSensor));

  const [tasks, setTasks]               = useState([]);
  const [openCreate, setOpenCreate]     = useState(false);
  const [editTask, setEditTask]         = useState(null);
  const [searchText, setSearchText]     = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  const columns = [
    { id: "todo",       name: "TO DO" },
    { id: "inprogress", name: "IN PROGRESS" },
    { id: "inreview",   name: "IN REVIEW" },
    { id: "done",       name: "DONE" },
  ];

  const loadTasks = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks?project_id=${projectId}`, { headers: { "Cache-Control": "no-store" } });
      setTasks(await res.json());
    } catch { toast.error("Failed to load tasks"); }
  };

  useEffect(() => { loadTasks(); }, [projectId]);

  const filteredTasks = tasks.filter(t => {
    const s = t.title.toLowerCase().includes(searchText.toLowerCase());
    const p = filterPriority ? t.priority === filterPriority : true;
    const a = filterAssignee ? t.user_id === Number(filterAssignee) : true;
    return s && p && a;
  });

  const getStatusLabel = s => ({ todo:"To Do", inprogress:"In Progress", inreview:"In Review", done:"Done" }[s]||s);

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const dragged = tasks.find(t => t.id === active.id); if (!dragged) return;
    let newStatus = over.id;
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) newStatus = overTask.status;
    if (dragged.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${active.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) toast.success(`Moved to ${getStatusLabel(newStatus)}`);
      else { toast.error("Failed to move"); loadTasks(); }
    } catch { toast.error("Failed to move"); loadTasks(); }
  };

  const handleCreateTask = async (task) => {
    try {
      const res = await fetch("http://localhost:8000/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, project_id: Number(projectId) }),
      });
      if (res.ok) { const t = await res.json(); setTasks(prev => [...prev, t]); toast.success("Issue created!"); }
      else toast.error("Failed to create");
    } catch { toast.error("Failed to create"); }
  };

  const handleUpdateTask = async (task) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${task.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task),
      });
      if (res.ok) {
        const u = await res.json();
        setTasks(prev => prev.map(t => t.id === u.id ? u : t));
        setEditTask(null); toast.success("Updated!");
      } else toast.error("Failed to update");
    } catch { toast.error("Failed to update"); }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) { setTasks(prev => prev.filter(t => t.id !== id)); setEditTask(null); toast.success("Deleted!"); }
      else toast.error("Failed to delete");
    } catch { toast.error("Failed to delete"); }
  };

  const uniqueAssignees = [...new Map(tasks.map(t => [t.user_id, t.user])).values()].filter(Boolean);

  return (
    <div className="flex flex-col h-full dark:bg-gray-900">
      <Toaster position="top-right"/>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">Board</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
            </svg>
            <input type="text" placeholder="Search board..." value={searchText} onChange={e => setSearchText(e.target.value)}
              className="pl-7 pr-3 py-1.5 border border-gray-200 rounded text-xs w-40 focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-600 focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Priority</option>
            <option value="High">▲ High</option>
            <option value="Medium">● Medium</option>
            <option value="Low">▼ Low</option>
          </select>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-600 focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Assignee</option>
            {uniqueAssignees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={() => setOpenCreate(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors">
            + Create
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-5">
            {columns.map(col => (
              <Column key={col.id} id={col.id} name={col.name}
                tasks={filteredTasks.filter(t => t.status === col.id).map(t => ({
                  ...t, assigneeName: t.user?.name || "Unassigned",
                  isOverdue: t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
                }))}
                onEditTask={task => setEditTask(task)}
                onCreateTask={() => setOpenCreate(true)}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {openCreate && <CreateTaskModal projectId={projectId} onClose={() => setOpenCreate(false)} onCreate={handleCreateTask}/>}
      {editTask    && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask}/>}
    </div>
  );
}