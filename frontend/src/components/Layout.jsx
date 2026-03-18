// File: frontend/src/components/Layout.jsx
// Action: REPLACE EXISTING FILE
// Changes: Added Achievements and Profile to NAV array (lines 19-20)

import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import NotificationBell from "./NotificationBell";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const ROLE_BADGE = {
  admin:     "bg-red-100 text-red-700",
  developer: "bg-purple-100 text-purple-700",
  member:    "bg-blue-100 text-blue-700",
  intern:    "bg-green-100 text-green-700",
};
const NAV = [
  { key: "summary",  label: "Summary",  icon: "⊞" },
  { key: "board",    label: "Board",    icon: "⊟" },
  { key: "timeline", label: "Timeline", icon: "≡" },
  { key: "team",     label: "Team",     icon: "👥" },
  { key: "achievements", label: "Achievements", icon: "🏆", isGlobal: true },
  { key: "profile",  label: "Profile",  icon: "👤", isGlobal: true },
  { key: "accounts", label: "Accounts",  icon: "🔐", adminOnly: true },
];

export default function Layout() {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const { dark, toggle } = useTheme();
  const { user, logout, token } = useAuth();

  const [project,    setProject]    = useState(null);
  const [projects,   setProjects]   = useState([]);
  const [teamInfo,   setTeamInfo]   = useState(null); // who manages this user
  const [showMenu,   setShowMenu]   = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const menuRef   = useRef(null);
  const switchRef = useRef(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        setProject(list.find(x => String(x.id) === String(projectId)) || null);
      }).catch(() => {});
  }, [projectId, token]);

  // For non-admins: fetch project members to show "You are working under [admin name]"
  useEffect(() => {
    if (!token || isAdmin || !projectId) return;
    fetch(`${API}/api/projects/${projectId}/members`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const members = Array.isArray(data) ? data : [];
        const admin   = members.find(m => m.role === "admin");
        setTeamInfo(admin || null);
      }).catch(() => {});
  }, [projectId, token, isAdmin]);

  useEffect(() => {
    const h = e => {
      if (menuRef.current   && !menuRef.current.contains(e.target))   setShowMenu(false);
      if (switchRef.current && !switchRef.current.contains(e.target)) setShowSwitch(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => {
    toast.dismiss(); // clear any lingering toasts
    logout();
    navigate("/login");
    // Show toast after navigation so it doesn't bleed into next page
    setTimeout(() => toast.success("Logged out!"), 100);
  };
  const avatarSrc = user?.avatarUrl ? `${API}${user.avatarUrl}` : null;

  if (!project) return (
    <div className="flex items-center justify-center h-screen bg-[#f4f5f7] dark:bg-gray-900">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${dark ? "dark" : ""}`}>
      <div className="flex w-full h-full bg-[#f4f5f7] dark:bg-gray-900">

        {/* Sidebar */}
        <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">

          {/* Project switcher */}
          <div ref={switchRef} className="relative px-3 py-3 border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => setShowSwitch(!showSwitch)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: project.color }}>{project.icon}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{project.name}</p>
                <p className="text-[10px] text-gray-400">Software project</p>
              </div>
              <span className="text-gray-400 text-xs flex-shrink-0">⌄</span>
            </button>
            {showSwitch && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1">
                <p className="text-[10px] text-gray-400 px-3 py-1.5 uppercase tracking-wider font-semibold">My Projects</p>
                {projects.map(p => (
                  <button key={p.id} onClick={() => { navigate(`/projects/${p.id}/summary`); setShowSwitch(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs transition-colors ${String(p.id) === String(projectId) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                    <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: p.color }}>{p.icon}</div>
                    <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{p.name}</span>
                    {String(p.id) === String(projectId) && <span className="ml-auto text-blue-500">✓</span>}
                  </button>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                  <button onClick={() => { navigate("/projects"); setShowSwitch(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs text-blue-600 font-medium">
                    ← All Projects
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* "You're working under" banner for non-admins */}
          {!isAdmin && teamInfo && (
            <div className="mx-3 mt-3 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Your Team Lead</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {teamInfo.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{teamInfo.name}</p>
                  <p className="text-[9px] text-blue-500 capitalize">{teamInfo.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {NAV.filter(item => !item.adminOnly || isAdmin).map(item => (
              <NavLink 
                key={item.key} 
                to={item.isGlobal ? `/${item.key}` : `/projects/${projectId}/${item.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                             : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                <span>{item.icon}</span>{item.label}
              </NavLink>
            ))}
          </nav>

          {/* Settings */}
          <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-700">
            <NavLink to={`/projects/${projectId}/settings`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                           : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              <span>⚙️</span> Settings
            </NavLink>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <button onClick={() => navigate("/projects")} className="hover:text-blue-600 transition-colors">Projects</button>
              <span>/</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">{project.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
                </svg>
                <input placeholder="Search..." className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs w-48 focus:outline-none focus:border-blue-400"/>
              </div>

              {/* 🔔 Notification Bell */}
              <NotificationBell/>

              {/* Avatar */}
              <div ref={menuRef} className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {avatarSrc
                    ? <img src={avatarSrc} alt={user?.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"/>
                    : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800"
                        style={{ background: user?.avatarColor || "#3b82f6" }}>{user?.name?.[0]?.toUpperCase()}</div>
                  }
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        {avatarSrc
                          ? <img src={avatarSrc} className="w-10 h-10 rounded-full object-cover"/>
                          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: user?.avatarColor || "#3b82f6" }}>{user?.name?.[0]?.toUpperCase()}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${ROLE_BADGE[user?.role] || ""}`}>{user?.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate("/projects"); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors">🏠 All Projects</button>
                      <button onClick={() => { navigate(`/projects/${projectId}/settings`); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors">⚙️ Settings</button>
                      <button onClick={() => { toggle(); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                        {dark ? "☀️" : "🌙"} {dark ? "Light Mode" : "Dark Mode"}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"/>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 font-medium transition-colors">🚪 Log out</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto dark:bg-gray-900"><Outlet/></main>
        </div>
      </div>
    </div>
  );
}