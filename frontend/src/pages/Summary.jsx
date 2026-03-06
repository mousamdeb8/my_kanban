import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STATUS_COLORS = {
  todo:       { color: "#3b82f6", label: "To Do" },
  inprogress: { color: "#f59e0b", label: "In Progress" },
  inreview:   { color: "#8b5cf6", label: "In Review" },
  done:       { color: "#22c55e", label: "Done" },
};
const PRIORITY_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#3b82f6" };

function stringToColor(str = "") {
  const c = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

export default function Summary() {
  const { projectId } = useParams();
  const { token } = useAuth();

  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/api/tasks?project_id=${projectId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([t]) => {
      setTasks(Array.isArray(t) ? t : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId, token]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const now        = new Date();
  const sevenAgo   = new Date(now - 7 * 86400000);
  const sevenAhead = new Date(now.getTime() + 7 * 86400000);
  const completed  = tasks.filter(t => t.status === "done" && new Date(t.updatedAt) >= sevenAgo).length;
  const updated    = tasks.filter(t => new Date(t.updatedAt) >= sevenAgo).length;
  const created    = tasks.filter(t => new Date(t.createdAt) >= sevenAgo).length;
  const dueSoon    = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= sevenAhead && new Date(t.dueDate) >= now && t.status !== "done").length;

  const statusCounts = Object.keys(STATUS_COLORS).reduce((a, s) => ({ ...a, [s]: tasks.filter(t => t.status === s).length }), {});
  const total = tasks.length;
  const radius = 60, circ = 2 * Math.PI * radius;
  let off = 0;
  const segments = Object.entries(statusCounts).map(([key, count]) => {
    const dash = total > 0 ? (count / total) * circ : 0;
    const seg = { key, count, color: STATUS_COLORS[key].color, dash, offset: off };
    off += dash;
    return seg;
  });

  const recent = [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);
  const timeAgo = (date) => {
    const d = Math.floor((now - new Date(date)) / 1000);
    if (d < 60) return "just now";
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`;
    return `${Math.floor(d/86400)}d ago`;
  };

  const priCounts = ["High","Medium","Low"].map(p => ({
    label: p, count: tasks.filter(t => t.priority === p).length, color: PRIORITY_COLORS[p],
  }));
  const maxPri = Math.max(...priCounts.map(p => p.count), 1);

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-full">
      <Toaster position="top-right"/>

      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Summary</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of your project activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: "✅", value: completed, label: "Completed", sub: "last 7 days", color: "text-green-600",  bg: "bg-green-50"  },
          { icon: "✏️", value: updated,   label: "Updated",   sub: "last 7 days", color: "text-blue-600",   bg: "bg-blue-50"   },
          { icon: "📋", value: created,   label: "Created",   sub: "last 7 days", color: "text-purple-600", bg: "bg-purple-50" },
          { icon: "⏰", value: dueSoon,   label: "Due soon",  sub: "next 7 days", color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.label}</p>
              <p className="text-[10px] text-gray-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status + Recent activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Status overview</h2>
          <p className="text-xs text-gray-400 mb-4">All work items by status</p>
          <div className="flex items-center gap-6">
            <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
              {total === 0
                ? <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22"/>
                : segments.map(s => (
                    <circle key={s.key} cx="80" cy="80" r={radius} fill="none"
                      stroke={s.color} strokeWidth="22"
                      strokeDasharray={`${s.dash} ${circ - s.dash}`}
                      strokeDashoffset={-s.offset + circ * 0.25}/>
                  ))
              }
              <text x="80" y="76" textAnchor="middle" style={{ fontSize: 24, fontWeight: 700, fill: "#1f2937" }}>{total}</text>
              <text x="80" y="94" textAnchor="middle" style={{ fontSize: 10, fill: "#9ca3af" }}>Total issues</text>
            </svg>
            <div className="space-y-2.5 flex-1">
              {Object.entries(STATUS_COLORS).map(([k, v]) => {
                const cnt = statusCounts[k];
                const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }}/>
                    <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{v.label}</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-white">{cnt}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Recent activity</h2>
          <p className="text-xs text-gray-400 mb-4">Latest updates</p>
          <div className="space-y-3 overflow-y-auto max-h-52">
            {recent.length === 0 && <p className="text-xs text-gray-400 italic">No activity yet</p>}
            {recent.map(task => {
              const a   = task.user?.name || "Unassigned";
              const cfg = STATUS_COLORS[task.status];
              return (
                <div key={task.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: stringToColor(a) }}>
                    {a[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">{a}</span>{" · "}
                      <span className="text-gray-500">{task.title}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: cfg?.color + "22", color: cfg?.color }}>
                        {cfg?.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{timeAgo(task.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Priority breakdown</h2>
        <p className="text-xs text-gray-400 mb-5">Distribution by priority</p>
        <div className="space-y-3">
          {priCounts.map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-16">{label}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxPri) * 100}%`, background: color }}/>
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}