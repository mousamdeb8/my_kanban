// File: frontend/src/components/Layout.jsx
// Action: REPLACE EXISTING FILE
// Changes: Complete light mode redesign - modern, clean, professional

import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  { key: "summary",  label: "Summary",  icon: "📊" },
  { key: "board",    label: "Board",    icon: "📋" },
  { key: "timeline", label: "Timeline", icon: "📅" },
  { key: "team",     label: "Team",     icon: "👥" },
  { key: "achievements", label: "Achievements", icon: "🏆", isGlobal: true },
  { key: "profile",  label: "Profile",  icon: "👤", isGlobal: true },
  { key: "accounts", label: "Accounts",  icon: "🔐", adminOnly: true },
];

export default function Layout() {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const { user, logout, token } = useAuth();

  const [project,    setProject]    = useState(null);
  const [projects,   setProjects]   = useState([]);
  const [teamInfo,   setTeamInfo]   = useState(null);
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
    toast.dismiss();
    logout();
    navigate("/login");
    setTimeout(() => toast.success("Logged out!"), 100);
  };
  const avatarSrc = user?.avatarUrl ? `${API}${user.avatarUrl}` : null;

  if (!project) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="flex w-full h-full">

        {/* Sidebar - LIGHT MODE */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">

          {/* Project switcher */}
          <div ref={switchRef} className="relative px-4 py-4 border-b border-gray-100">
            <button onClick={() => setShowSwitch(!showSwitch)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
                style={{ background: project.color }}>{project.icon}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{project.name}</p>
                <p className="text-xs text-gray-500">Software project</p>
              </div>
              <span className="text-gray-400 text-sm flex-shrink-0">⌄</span>
            </button>
            {showSwitch && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                <p className="text-xs text-gray-400 px-4 py-2 uppercase tracking-wider font-semibold">My Projects</p>
                {projects.map(p => (
                  <button key={p.id} onClick={() => { navigate(`/projects/${p.id}/summary`); setShowSwitch(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-sm transition-colors ${String(p.id) === String(projectId) ? "bg-blue-50" : ""}`}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: p.color }}>{p.icon}</div>
                    <span className="font-medium text-gray-800 truncate">{p.name}</span>
                    {String(p.id) === String(projectId) && <span className="ml-auto text-blue-600 font-bold">✓</span>}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={() => { navigate("/projects"); setShowSwitch(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-blue-600 font-semibold">
                    ← All Projects
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Team Lead banner */}
          {!isAdmin && teamInfo && (
            <div className="mx-4 mt-4 px-3 py-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Your Team Lead</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {teamInfo.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{teamInfo.name}</p>
                  <p className="text-xs text-blue-600 capitalize">{teamInfo.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav - LIGHT MODE */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.filter(item => !item.adminOnly || isAdmin).map(item => (
              <NavLink 
                key={item.key} 
                to={item.isGlobal ? `/${item.key}` : `/projects/${projectId}/${item.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" 
                      : "text-gray-700 hover:bg-gray-100"}`}>
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Settings - LIGHT MODE */}
          <div className="px-3 py-4 border-t border-gray-100">
            <NavLink to={`/projects/${projectId}/settings`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md" 
                    : "text-gray-700 hover:bg-gray-100"}`}>
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </NavLink>
          </div>
        </aside>

        {/* Main - LIGHT MODE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - LIGHT MODE */}
          <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => navigate("/projects")} className="text-gray-500 hover:text-blue-600 font-medium transition-colors">
                Projects
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-semibold">{project.name}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
                </svg>
                <input 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm w-64 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Notification Bell */}
              <NotificationBell/>

              {/* Avatar Menu - LIGHT MODE */}
              <div ref={menuRef} className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-2 py-1.5 transition-colors">
                  {avatarSrc
                    ? <img src={avatarSrc} alt={user?.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"/>
                    : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-gray-200"
                        style={{ background: user?.avatarColor || "#3b82f6" }}>{user?.name?.[0]?.toUpperCase()}</div>
                  }
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        {avatarSrc
                          ? <img src={avatarSrc} className="w-12 h-12 rounded-full object-cover ring-2 ring-white"/>
                          : <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-white" style={{ background: user?.avatarColor || "#3b82f6" }}>{user?.name?.[0]?.toUpperCase()}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                          <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${ROLE_BADGE[user?.role] || ""}`}>{user?.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate("/projects"); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors">
                        🏠 All Projects
                      </button>
                      <button onClick={() => { navigate(`/projects/${projectId}/settings`); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors">
                        ⚙️ Settings
                      </button>
                      <div className="border-t border-gray-100 my-1"/>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-600 font-semibold transition-colors">
                        🚪 Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area - LIGHT MODE */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Outlet/>
          </main>
        </div>
      </div>
    </div>
  );
}