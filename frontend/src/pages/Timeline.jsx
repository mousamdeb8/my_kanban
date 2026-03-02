import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const STATUS_COLORS = {
  todo:       { bar: "#3b82f6", light: "#dbeafe", label: "To Do" },
  inprogress: { bar: "#f59e0b", light: "#fef3c7", label: "In Progress" },
  inreview:   { bar: "#8b5cf6", light: "#ede9fe", label: "In Review" },
  done:       { bar: "#22c55e", light: "#dcfce7", label: "Done" },
};

const PRIORITY_ICONS = { High: "▲", Medium: "●", Low: "▼" };

const VIEW_MODES = ["Weeks", "Months", "Quarters"];

function stringToColor(str) {
  const colors = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date) {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
}

export default function Timeline() {
  const { projectId } = useParams();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [viewMode, setViewMode] = useState("Months");
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const todayLineRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/tasks?project_id=${projectId}`, { headers: { "Cache-Control": "no-store" } })
      .then(r => r.json())
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Scroll to today on load
  useEffect(() => {
    if (!loading && scrollRef.current && todayLineRef.current) {
      setTimeout(() => {
        todayLineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }, 100);
    }
  }, [loading, viewMode]);

  const today = new Date();
  today.setHours(0,0,0,0);

  // ── Build date range ──
  const validTasks = tasks.filter(t => t.dueDate);

  const allDates = validTasks.flatMap(t => [
    new Date(t.createdAt), new Date(t.dueDate)
  ]);

  const minDate = allDates.length > 0
    ? new Date(Math.min(...allDates.map(d => d.getTime())))
    : addDays(today, -30);
  const maxDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : addDays(today, 60);

  // Pad range
  const rangeStart = addDays(minDate, -14);
  const rangeEnd   = addDays(maxDate, 14);

  rangeStart.setHours(0,0,0,0);
  rangeEnd.setHours(0,0,0,0);

  const totalDays = Math.ceil((rangeEnd - rangeStart) / 86400000) + 1;

  // ── Column widths per view ──
  const COL_WIDTH = viewMode === "Weeks" ? 30 : viewMode === "Months" ? 20 : 12;

  function dayOffset(date) {
    const d = new Date(date); d.setHours(0,0,0,0);
    return Math.floor((d - rangeStart) / 86400000);
  }

  // ── Build header columns ──
  function buildHeaders() {
    const headers = [];
    let cur = new Date(rangeStart);

    if (viewMode === "Weeks") {
      while (cur <= rangeEnd) {
        const weekStart = new Date(cur);
        const weekEnd = addDays(cur, 6);
        const label = cur.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        headers.push({ label, days: 7, start: new Date(cur) });
        cur = addDays(cur, 7);
      }
    } else if (viewMode === "Months") {
      cur = startOfMonth(rangeStart);
      while (cur <= rangeEnd) {
        const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
        const label = cur.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        headers.push({ label, days: daysInMonth, start: new Date(cur) });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    } else {
      cur = startOfQuarter(rangeStart);
      while (cur <= rangeEnd) {
        const qEnd = new Date(cur.getFullYear(), cur.getMonth() + 3, 0);
        const days = Math.ceil((qEnd - cur) / 86400000) + 1;
        const qNum = Math.floor(cur.getMonth() / 3) + 1;
        const label = `Q${qNum} ${cur.getFullYear()}`;
        headers.push({ label, days, start: new Date(cur) });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);
      }
    }
    return headers;
  }

  const headers = buildHeaders();
  const totalWidth = totalDays * COL_WIDTH;
  const todayOffset = dayOffset(today);
  const ROW_HEIGHT = 44;
  const LEFT_PANEL = 220;

  // Filter tasks
  const filtered = validTasks.filter(t => {
    const matchStatus   = filterStatus   ? t.status === filterStatus : true;
    const matchAssignee = filterAssignee ? String(t.user_id) === filterAssignee : true;
    return matchStatus && matchAssignee;
  });

  const uniqueAssignees = [...new Map(tasks.map(t => [t.user_id, t.user])).values()].filter(Boolean);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Sub-header ── */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Timeline</h2>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-600 focus:outline-none focus:border-blue-400"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_COLORS).map(([k,v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-600 focus:outline-none focus:border-blue-400"
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
          </select>

          {/* View mode toggle */}
          <div className="flex border border-gray-200 rounded overflow-hidden">
            {VIEW_MODES.map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === m ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Today button */}
          <button
            onClick={() => todayLineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })}
            className="px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Gantt body ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div style={{ minWidth: LEFT_PANEL + totalWidth }}>

            {/* Header row */}
            <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
              {/* Left panel header */}
              <div
                className="flex-shrink-0 border-r border-gray-200 flex items-center px-4 bg-gray-50"
                style={{ width: LEFT_PANEL, height: 48 }}
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</span>
              </div>

              {/* Date headers */}
              <div className="relative flex-1 overflow-hidden" style={{ height: 48 }}>
                <div className="flex h-full">
                  {headers.map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 border-r border-gray-100 flex items-center px-2 bg-gray-50"
                      style={{ width: h.days * COL_WIDTH, height: 48 }}
                    >
                      <span className="text-xs font-semibold text-gray-500 truncate">{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400 italic">
                No tasks with due dates found
              </div>
            ) : (
              filtered.map((task, idx) => {
                const cfg       = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
                const assignee  = task.user?.name || "Unassigned";
                const startDate = new Date(task.createdAt); startDate.setHours(0,0,0,0);
                const endDate   = new Date(task.dueDate);   endDate.setHours(0,0,0,0);
                const barStart  = dayOffset(startDate);
                const barEnd    = dayOffset(endDate);
                const barWidth  = Math.max((barEnd - barStart + 1) * COL_WIDTH, COL_WIDTH);
                const barLeft   = barStart * COL_WIDTH;
                const isOverdue = endDate < today && task.status !== "done";
                const isDone    = task.status === "done";
                const daysLeft  = Math.ceil((endDate - today) / 86400000);
                const isSelected = selectedTask?.id === task.id;

                return (
                  <div
                    key={task.id}
                    className={`flex border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${isSelected ? "bg-blue-50/50" : ""}`}
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => setSelectedTask(isSelected ? null : task)}
                  >
                    {/* Left panel */}
                    <div
                      className="flex-shrink-0 border-r border-gray-100 flex items-center gap-2 px-3"
                      style={{ width: LEFT_PANEL }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: stringToColor(assignee) }}
                      >
                        {assignee[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{task.title}</p>
                        <p className="text-[10px] text-gray-400">KAN-{task.id} · {assignee}</p>
                      </div>
                    </div>

                    {/* Gantt bar area */}
                    <div className="relative flex-1" style={{ height: ROW_HEIGHT }}>
                      {/* Today vertical line */}
                      {todayOffset >= 0 && todayOffset <= totalDays && (
                        <div
                          ref={idx === 0 ? todayLineRef : null}
                          className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                          style={{ left: todayOffset * COL_WIDTH }}
                        />
                      )}

                      {/* Background grid lines */}
                      {headers.map((h, i) => {
                        const left = dayOffset(h.start) * COL_WIDTH;
                        return (
                          <div key={i} className="absolute top-0 bottom-0 border-r border-gray-100"
                            style={{ left: left + h.days * COL_WIDTH }} />
                        );
                      })}

                      {/* Bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded flex items-center px-2 overflow-hidden group/bar"
                        style={{
                          left: barLeft,
                          width: barWidth,
                          height: 26,
                          background: isOverdue ? "#fecaca" : isDone ? cfg.light : cfg.light,
                          border: `1.5px solid ${isOverdue ? "#ef4444" : cfg.bar}`,
                        }}
                        title={`${task.title}\n${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`}
                      >
                        {/* Progress fill for done */}
                        {isDone && (
                          <div className="absolute inset-0 rounded" style={{ background: cfg.bar, opacity: 0.25 }} />
                        )}

                        <span
                          className="text-[10px] font-semibold truncate relative z-10"
                          style={{ color: isOverdue ? "#dc2626" : cfg.bar }}
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Due date label */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 text-[9px] text-gray-400 whitespace-nowrap pl-1"
                        style={{ left: barLeft + barWidth + 4 }}
                      >
                        {endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        {isOverdue && <span className="text-red-500 ml-1">Overdue</span>}
                        {!isOverdue && !isDone && daysLeft === 0 && <span className="text-orange-500 ml-1">Due today</span>}
                        {!isOverdue && !isDone && daysLeft > 0 && <span className="text-gray-400 ml-1">{daysLeft}d left</span>}
                        {isDone && <span className="text-green-500 ml-1">✓ Done</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Selected task detail panel ── */}
        {selectedTask && (() => {
          const cfg      = STATUS_COLORS[selectedTask.status] || STATUS_COLORS.todo;
          const assignee = selectedTask.user?.name || "Unassigned";
          const start    = new Date(selectedTask.createdAt);
          const end      = new Date(selectedTask.dueDate);
          const duration = Math.ceil((end - start) / 86400000);
          const daysLeft = Math.ceil((end - today) / 86400000);

          return (
            <div className="border-t border-gray-200 bg-white flex-shrink-0 px-6 py-4 flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">KAN-{selectedTask.id}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: cfg.light, color: cfg.bar }}>
                    {cfg.label}
                  </span>
                  {selectedTask.priority && (
                    <span className="text-[10px] text-gray-500">{PRIORITY_ICONS[selectedTask.priority]} {selectedTask.priority}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-800">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-xs text-gray-500 mt-1">{selectedTask.description}</p>
                )}
              </div>

              <div className="flex gap-6 text-xs flex-shrink-0">
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Assignee</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: stringToColor(assignee) }}>
                      {assignee[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700">{assignee}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Start</p>
                  <p className="font-medium text-gray-700">{start.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Due</p>
                  <p className={`font-medium ${daysLeft < 0 && selectedTask.status !== "done" ? "text-red-500" : "text-gray-700"}`}>
                    {end.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Duration</p>
                  <p className="font-medium text-gray-700">{duration} days</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Remaining</p>
                  <p className={`font-medium ${daysLeft < 0 ? "text-red-500" : daysLeft === 0 ? "text-orange-500" : "text-gray-700"}`}>
                    {selectedTask.status === "done" ? "✓ Completed" : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0">×</button>
            </div>
          );
        })()}

        {/* ── Legend ── */}
        <div className="border-t border-gray-100 px-6 py-2 flex items-center gap-6 flex-shrink-0 bg-gray-50">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Legend:</span>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: v.bar }} />
              <span className="text-[10px] text-gray-500">{v.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-400" />
            <span className="text-[10px] text-gray-500">Overdue</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-px h-4 bg-blue-500" />
            <span className="text-[10px] text-gray-500">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}