import { useEffect, useState } from "react";

const STATUS_COLORS = {
  todo:       { color: "#3b82f6", label: "To Do" },
  inprogress: { color: "#f59e0b", label: "In Progress" },
  inreview:   { color: "#8b5cf6", label: "In Review" },
  done:       { color: "#22c55e", label: "Done" },
};

const PRIORITY_COLORS = {
  High:   "#ef4444",
  Medium: "#f59e0b",
  Low:    "#3b82f6",
};

export default function Summary() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/tasks", { headers: { "Cache-Control": "no-store" } })
      .then(r => r.json())
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Stats ──
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 86400000);

  const completed  = tasks.filter(t => t.status === "done" && new Date(t.updatedAt) >= sevenDaysAgo).length;
  const updated    = tasks.filter(t => new Date(t.updatedAt) >= sevenDaysAgo).length;
  const created    = tasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo).length;
  const dueSoon    = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= sevenDaysAhead && new Date(t.dueDate) >= now && t.status !== "done").length;

  // ── Status overview (donut) ──
  const statusCounts = Object.keys(STATUS_COLORS).reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length;
    return acc;
  }, {});
  const total = tasks.length;

  // SVG donut
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = Object.entries(statusCounts).map(([key, count]) => {
    const pct = total > 0 ? count / total : 0;
    const dash = pct * circumference;
    const seg = { key, count, color: STATUS_COLORS[key].color, dash, offset };
    offset += dash;
    return seg;
  });

  // ── Recent activity ──
  const recent = [...tasks]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8);

  const timeAgo = (date) => {
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60)   return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // ── Priority breakdown ──
  const priorityCounts = ["High", "Medium", "Low"].map(p => ({
    label: p,
    count: tasks.filter(t => t.priority === p).length,
    color: PRIORITY_COLORS[p],
  }));
  const maxPriority = Math.max(...priorityCounts.map(p => p.count), 1);

  return (
    <div className="p-6 space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Summary</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of your project activity</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: "✅", value: completed, label: "Completed",  sub: "in the last 7 days", color: "text-green-600", bg: "bg-green-50" },
          { icon: "✏️",  value: updated,  label: "Updated",    sub: "in the last 7 days", color: "text-blue-600",  bg: "bg-blue-50" },
          { icon: "📋", value: created,   label: "Created",    sub: "in the last 7 days", color: "text-purple-600",bg: "bg-purple-50" },
          { icon: "⏰", value: dueSoon,   label: "Due soon",   sub: "in the next 7 days", color: "text-orange-600",bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center text-lg flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-700">{s.label}</p>
              <p className="text-[10px] text-gray-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status overview + Recent activity ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Status donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Status overview</h2>
          <p className="text-xs text-gray-400 mb-4">Snapshot of all work items by status</p>

          <div className="flex items-center gap-6">
            {/* Donut SVG */}
            <div className="relative flex-shrink-0">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {total === 0 ? (
                  <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22" />
                ) : (
                  segments.map((seg) => (
                    <circle
                      key={seg.key}
                      cx="80" cy="80" r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="22"
                      strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                      strokeDashoffset={-seg.offset + circumference * 0.25}
                      style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                  ))
                )}
                <text x="80" y="76" textAnchor="middle" className="text-2xl font-bold" style={{ fontSize: 24, fontWeight: 700, fill: "#1f2937" }}>
                  {total}
                </text>
                <text x="80" y="94" textAnchor="middle" style={{ fontSize: 10, fill: "#9ca3af" }}>
                  Total issues
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 flex-1">
              {Object.entries(STATUS_COLORS).map(([key, cfg]) => {
                const count = statusCounts[key];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <span className="text-xs text-gray-600 flex-1">{cfg.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{count}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Recent activity</h2>
          <p className="text-xs text-gray-400 mb-4">Latest updates across the project</p>

          <div className="space-y-3 overflow-y-auto max-h-52">
            {recent.length === 0 && (
              <p className="text-xs text-gray-400 italic">No activity yet</p>
            )}
            {recent.map((task) => {
              const assignee = task.user?.name || "Unassigned";
              const statusCfg = STATUS_COLORS[task.status];
              return (
                <div key={task.id} className="flex items-start gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: stringToColor(assignee) }}
                  >
                    {assignee[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-semibold">{assignee}</span>
                      {" · "}
                      <span className="text-gray-500 truncate">{task.title}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: statusCfg?.color + "22", color: statusCfg?.color }}
                      >
                        {statusCfg?.label || task.status}
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

      {/* ── Priority breakdown ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Priority breakdown</h2>
        <p className="text-xs text-gray-400 mb-5">Distribution of issues by priority</p>

        <div className="space-y-3">
          {priorityCounts.map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-16">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxPriority) * 100}%`, background: color }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>

        {/* Assignee workload */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 mb-3">Assignee workload</h3>
          <div className="flex flex-wrap gap-3">
            {[...new Map(tasks.map(t => [t.user_id, t.user])).values()]
              .filter(Boolean)
              .map(user => {
                const userTasks = tasks.filter(t => t.user_id === user.id);
                const donePct = userTasks.length > 0
                  ? Math.round((userTasks.filter(t => t.status === "done").length / userTasks.length) * 100)
                  : 0;
                return (
                  <div key={user.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: stringToColor(user.name) }}
                    >
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{user.name}</p>
                      <p className="text-[10px] text-gray-400">{userTasks.length} issues · {donePct}% done</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

    </div>
  );
}

function stringToColor(str) {
  const colors = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}