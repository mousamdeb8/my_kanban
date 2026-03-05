import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000";

const TYPE_CONFIG = {
  assigned: { icon: "🎯", bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-100 dark:border-blue-800"    },
  status:   { icon: "🔄", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-100 dark:border-purple-800" },
  review:   { icon: "👀", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-100 dark:border-yellow-800" },
  created:  { icon: "✅", bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-100 dark:border-green-800"   },
  overdue:  { icon: "⚠️", bg: "bg-red-50 dark:bg-red-900/20",      border: "border-red-100 dark:border-red-800"       },
  team:     { icon: "👥", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-100 dark:border-indigo-800" },
  info:     { icon: "📌", bg: "bg-gray-50 dark:bg-gray-700",        border: "border-gray-100 dark:border-gray-600"     },
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open,          setOpen]          = useState(false);
  const ref = useRef(null);

  const authH = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/notifications`, { headers: authH });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, [token]);

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, { method: "PATCH", headers: authH });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/api/notifications/read-all`, { method: "PATCH", headers: authH });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await fetch(`${API}/api/notifications/clear`, { method: "DELETE", headers: authH });
      setNotifications([]);
    } catch {}
  };

  // Click notification → mark read + navigate to the task's board
  const handleClick = async (n) => {
    await markRead(n.id);
    setOpen(false);
    if (n.projectId && n.taskId) {
      // Navigate to board — the board will highlight/open the task
      navigate(`/projects/${n.projectId}/board?taskId=${n.taskId}`);
    } else if (n.projectId) {
      navigate(`/projects/${n.projectId}/board`);
    }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800 dark:text-white">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-gray-600">Clear</button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-96">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-3xl mb-2">🔔</span>
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[10px] text-gray-300 mt-1">Task assignments will appear here</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg       = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const clickable = !!(n.projectId || n.taskId);
                return (
                  <button key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 transition-colors
                      ${!n.isRead ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}
                      ${clickable ? "hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" : "cursor-default"}`}>
                    <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm border ${cfg.bg} ${cfg.border}`}>
                      {cfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${!n.isRead ? "font-semibold text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {n.message}
                      </p>
                      {n.sub && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{n.sub}</p>}
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-[10px] text-gray-300">{timeAgo(n.createdAt)}</p>
                        {clickable && (
                          <span className="text-[9px] text-blue-400 font-medium">→ View task</span>
                        )}
                      </div>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"/>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}