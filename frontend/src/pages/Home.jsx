// File: frontend/src/pages/Home.jsx
// Action: REPLACE EXISTING FILE
// Changes: Light mode colors + fix any undefined variable errors

import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import Column from "../components/Column";
import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const COLUMNS = [
  { id: "todo",       name: "TO DO",       dot: "#3b82f6" },
  { id: "inprogress", name: "IN PROGRESS", dot: "#f59e0b" },
  { id: "inreview",   name: "IN REVIEW",   dot: "#8b5cf6" },
  { id: "done",       name: "DONE",        dot: "#22c55e" },
];

export default function Home() {
  const { projectId } = useParams();
  const { user, token } = useAuth();
  const { addNotification } = useNotifications();
  const location = useLocation();
  const sensors = useSensors(useSensor(PointerSensor));

  const role     = user?.role;
  const isAdmin  = role === "admin";
  const isDev    = role === "developer";
  const isMember = role === "member";
  const isIntern = role === "intern";
  const canCreate = isAdmin || isDev || isIntern;
  const canEdit   = isAdmin || isDev;
  const canDelete = isAdmin;

  const [tasks,          setTasks]          = useState([]);
  const [openCreate,     setOpenCreate]     = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [searchText,     setSearchText]     = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  const notifiedOverdue = useRef(new Set());

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get("taskId");
    if (taskId && tasks.length > 0) {
      const found = tasks.find(t => String(t.id) === String(taskId));
      if (found) setEditTask(found);
    }
  }, [location.search, tasks]);

  const loadTasks = async () => {
    try {
      const res  = await fetch(`${API}/api/tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTasks(list);

      const now = new Date(); 
      now.setHours(0,0,0,0);
      list.forEach(t => {
        if (!t.dueDate || t.status === "done") return;
        const due = new Date(t.dueDate); 
        due.setHours(0,0,0,0);
        if (due < now && !notifiedOverdue.current.has(t.id)) {
          notifiedOverdue.current.add(t.id);
          addNotification({
            type: "overdue",
            message: `Task overdue: ${t.title}`,
            sub: `Was due ${due.toLocaleDateString()}`,
          });
        }
      });
    } catch (err) { 
      console.error("Failed to load tasks:", err);
      toast.error("Failed to load tasks"); 
    }
  };

  useEffect(() => { 
    if (token && projectId) loadTasks(); 
  }, [projectId, token]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const taskId  = active.id;
    const dragged = tasks.find(t => t.id === taskId);
    if (!dragged) return;
    let newStatus = over.id;
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) newStatus = overTask.status;
    if (dragged.status === newStatus) return;

    if (isIntern) {
      const isOwn = dragged.user?.email === user?.email;
      if (!isOwn) { toast.error("You can only move your own tasks"); return; }
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}/status`, {
        method: "PATCH", headers: authHeaders, body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const colName = COLUMNS.find(c => c.id === newStatus)?.name || newStatus;
        toast.success(`Moved to ${colName}`);
        if (newStatus === "inreview") {
          addNotification({ type: "review", message: `"${dragged.title}" moved to In Review`, sub: `Assigned to ${dragged.user?.name || "Unassigned"}` });
        }
      } else { const d = await res.json(); toast.error(d.message || "Failed"); loadTasks(); }
    } catch (err) { 
      console.error("Drag error:", err);
      toast.error("Failed"); 
      loadTasks(); 
    }
  };

  const handleCreateTask = async (task) => {
    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: "POST", headers: authHeaders,
        body: JSON.stringify({ ...task, project_id: Number(projectId) }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
        toast.success("Task created!");
        if (newTask.user?.name) {
          addNotification({ type: "assigned", message: `New task assigned to ${newTask.user.name}`, sub: newTask.title });
        }
      } else { const d = await res.json(); toast.error(d.message || "Failed"); }
    } catch (err) { 
      console.error("Create task error:", err);
      toast.error("Failed to create task"); 
    }
  };

  const handleTaskReviewed = (updatedTask) => {
    setTasks(p => p.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditTask(null);
  };

  const handleUpdateTask = async (task) => {
    const prev = tasks.find(t => t.id === task.id);
    try {
      const res = await fetch(`${API}/api/tasks/${task.id}`, {
        method: "PUT", headers: authHeaders, body: JSON.stringify(task),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(p => p.map(t => t.id === updated.id ? updated : t));
        setEditTask(null);
        toast.success("Task updated!");

        if (prev?.user_id !== task.user_id && task.user_id) {
          addNotification({ type: "assigned", message: `Task assigned to ${updated.user?.name || "someone"}`, sub: updated.title });
        }
        if (prev?.status !== task.status && task.status === "inreview") {
          addNotification({ type: "review", message: `"${updated.title}" is in review`, sub: `Assigned to ${updated.user?.name || "Unassigned"}` });
        }
        if (prev?.status !== task.status) {
          addNotification({ type: "status", message: `Status changed to ${task.status}`, sub: updated.title });
        }
      } else { const d = await res.json(); toast.error(d.message || "Failed"); }
    } catch (err) { 
      console.error("Update task error:", err);
      toast.error("Failed to update"); 
    }
  };

  const handleDeleteTask = async (id) => {
    if (!canDelete) { toast.error("Only admins can delete tasks"); return; }
    try {
      const res = await fetch(`${API}/api/tasks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setTasks(prev => prev.filter(t => t.id !== id)); setEditTask(null); toast.success("Deleted"); }
      else { const d = await res.json(); toast.error(d.message || "Failed"); }
    } catch (err) { 
      console.error("Delete task error:", err);
      toast.error("Failed to delete"); 
    }
  };

  const canEditThisTask = (task) => {
    if (canEdit) return true;
    if (isIntern) return task.user?.email === user?.email;
    return false;
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch   = t.title.toLowerCase().includes(searchText.toLowerCase());
    const matchPriority = filterPriority ? t.priority === filterPriority : true;
    const matchAssignee = filterAssignee ? t.user_id === Number(filterAssignee) : true;
    return matchSearch && matchPriority && matchAssignee;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }}/>

      {/* Header - LIGHT MODE */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-sm font-bold text-gray-800 tracking-widest">BOARD</h1>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
            </svg>
            <input placeholder="Search board..." value={searchText} onChange={e => setSearchText(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-xs w-40 focus:outline-none focus:border-blue-400"/>
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none">
            <option value="">Priority</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🔵 Low</option>
          </select>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none">
            <option value="">Assignee</option>
            {[...new Map(tasks.map(t => [t.user_id, t.user])).values()].filter(Boolean).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          {canCreate && (
            <button onClick={() => setOpenCreate(true)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
              + Create Task
            </button>
          )}
          {isMember && (
            <span className="text-[10px] px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium border border-blue-100">
              👁 View & move only
            </span>
          )}
          {isIntern && (
            <span className="text-[10px] px-2.5 py-1 bg-green-50 text-green-600 rounded-lg font-medium border border-green-100">
              🌱 Own tasks only
            </span>
          )}
        </div>
      </div>

      {/* Board - LIGHT MODE */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-5 overflow-x-auto flex-1 items-start bg-gray-50">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              id={col.id}
              name={col.name}
              dot={col.dot}
              canCreate={canCreate}
              tasks={filteredTasks.filter(t => t.status === col.id).map(t => ({
                ...t,
                assigneeName: t.user?.name || "Unassigned",
                isOverdue: t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
              }))}
              onEditTask={t => setEditTask(t)}
              onQuickCreate={canCreate ? () => setOpenCreate(true) : null}
              currentUser={user}
              token={token}
              onTaskUpdated={(updated) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))}
            />
          ))}
        </div>
      </DndContext>

      {openCreate && canCreate && (
        <CreateTaskModal projectId={projectId} token={token} user={user}
          onClose={() => setOpenCreate(false)} onCreate={handleCreateTask}/>
      )}
      {editTask && (
        <EditTaskModal task={editTask} token={token} user={user}
          canEdit={canEditThisTask(editTask)} canDelete={canDelete}
          onClose={() => setEditTask(null)} onUpdate={handleUpdateTask} onReviewed={handleTaskReviewed} onDelete={handleDeleteTask}/>
      )}
    </div>
  );
}