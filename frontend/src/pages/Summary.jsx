// File: frontend/src/pages/Summary.jsx
// Action: REPLACE EXISTING FILE
// Fix: Remove leaderboard to prevent 401 errors and blank page

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Summary() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!token || !projectId) return;

    // Fetch project
    fetch(`${API}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const projects = Array.isArray(data) ? data : [];
        const proj = projects.find((p) => String(p.id) === String(projectId));
        setProject(proj);
      })
      .catch((err) => console.error("Failed to fetch project:", err));

    // Fetch tasks
    fetch(`${API}/api/tasks?project_id=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const taskList = Array.isArray(data) ? data : [];
        setTasks(taskList);
      })
      .catch((err) => console.error("Failed to fetch tasks:", err));
  }, [projectId, token]);

  const stats = {
    completed: tasks.filter((t) => t.status === "done").length,
    updated: tasks.filter((t) => {
      const updatedAt = new Date(t.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return updatedAt > weekAgo;
    }).length,
    created: tasks.filter((t) => {
      const createdAt = new Date(t.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length,
    dueSoon: tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      const due = new Date(t.dueDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return due <= weekFromNow && due >= new Date();
    }).length,
  };

  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    inprogress: tasks.filter((t) => t.status === "inprogress").length,
    inreview: tasks.filter((t) => t.status === "inreview").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const priorityCounts = {
    High: tasks.filter((t) => t.priority === "High").length,
    Medium: tasks.filter((t) => t.priority === "Medium").length,
    Low: tasks.filter((t) => t.priority === "Low").length,
  };

  const recentActivity = tasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your project activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
              <div className="text-sm font-semibold text-gray-600">Completed</div>
              <div className="text-xs text-gray-400">last 7 days</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              📝
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.updated}</div>
              <div className="text-sm font-semibold text-gray-600">Updated</div>
              <div className="text-xs text-gray-400">last 7 days</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.created}</div>
              <div className="text-sm font-semibold text-gray-600">Created</div>
              <div className="text-xs text-gray-400">last 7 days</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
              ⏰
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.dueSoon}</div>
              <div className="text-sm font-semibold text-gray-600">Due soon</div>
              <div className="text-xs text-gray-400">next 7 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status overview</h3>
          <p className="text-sm text-gray-500 mb-6">All work items by status</p>

          <div className="space-y-4">
            {[
              { label: "To Do", count: statusCounts.todo, color: "bg-blue-500", pct: (statusCounts.todo / tasks.length) * 100 || 0 },
              { label: "In Progress", count: statusCounts.inprogress, color: "bg-yellow-500", pct: (statusCounts.inprogress / tasks.length) * 100 || 0 },
              { label: "In Review", count: statusCounts.inreview, color: "bg-purple-500", pct: (statusCounts.inreview / tasks.length) * 100 || 0 },
              { label: "Done", count: statusCounts.done, color: "bg-green-500", pct: (statusCounts.done / tasks.length) * 100 || 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500">{Math.round(item.pct)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Priority breakdown</h3>
          <p className="text-sm text-gray-500 mb-6">Distribution by priority</p>

          <div className="space-y-4">
            {[
              { label: "High", count: priorityCounts.High, color: "bg-red-500" },
              { label: "Medium", count: priorityCounts.Medium, color: "bg-orange-500" },
              { label: "Low", count: priorityCounts.Low, color: "bg-blue-500" },
            ].map((item) => {
              const total = priorityCounts.High + priorityCounts.Medium + priorityCounts.Low;
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent activity</h3>
        <p className="text-sm text-gray-500 mb-6">Latest updates</p>

        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {task.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{task.title}</div>
                  <div className="text-sm text-gray-500">
                    {task.status} · {new Date(task.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  task.priority === "High" ? "bg-red-100 text-red-700" :
                  task.priority === "Medium" ? "bg-orange-100 text-orange-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {task.priority}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Leaderboard and gamification features will appear here once the database tables are set up.
        </p>
      </div>
    </div>
  );
}