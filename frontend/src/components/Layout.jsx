import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const NAV = [
  { key: "summary",  label: "Summary",  icon: "⊞" },
  { key: "board",    label: "Board",    icon: "▦" },
  { key: "timeline", label: "Timeline", icon: "≡" },
];

export default function Layout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const [project,  setProject]  = useState(null);
  const [projects, setProjects] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showProjectSwitch, setShowProjectSwitch] = useState(false);
  const menuRef   = useRef(null);
  const switchRef = useRef(null);

  const [profile] = useState(() => {
    const s = localStorage.getItem("profile");
    return s ? JSON.parse(s) : { name: "Mousam Deb", email: "mousam@example.com", role: "admin", avatarColor: "#3b82f6" };
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/projects")
      .then(r => r.json())
      .then(data => {
        setProjects(data);
        setProject(data.find(x => String(x.id) === String(projectId)) || null);
      });
  }, [projectId]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current   && !menuRef.current.contains(e.target))   setShowMenu(false);
      if (switchRef.current && !switchRef.current.contains(e.target)) setShowProjectSwitch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            <button onClick={() => setShowProjectSwitch(!showProjectSwitch)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: project.color }}>{project.icon}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{project.name}</p>
                <p className="text-[10px] text-gray-400">Software project</p>
              </div>
              <span className="text-gray-400 text-xs">⌄</span>
            </button>

            {showProjectSwitch && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1">
                <p className="text-[10px] text-gray-400 px-3 py-1.5 uppercase tracking-wider font-semibold">Switch Project</p>
                {projects.map(p => (
                  <button key={p.id} onClick={() => { navigate(`/projects/${p.id}/summary`); setShowProjectSwitch(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${String(p.id) === String(projectId) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: p.color }}>{p.icon}</div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{p.name}</span>
                    {String(p.id) === String(projectId) && <span className="ml-auto text-blue-500 text-xs">✓</span>}
                  </button>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                  <button onClick={() => { navigate("/projects"); setShowProjectSwitch(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs text-blue-600 font-medium">
                    <span>+</span> All Projects
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {NAV.map(item => (
              <NavLink key={item.key} to={`/projects/${projectId}/${item.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                <span className="text-base">{item.icon}</span>{item.label}
              </NavLink>
            ))}
          </nav>

          {/* Settings at bottom of sidebar */}
          <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-700">
            <NavLink to={`/projects/${projectId}/settings`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              <span className="text-base">⚙️</span> Settings
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

              {/* Avatar dropdown */}
              <div ref={menuRef} className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity ring-2 ring-white dark:ring-gray-800"
                  style={{ background: profile.avatarColor || "#3b82f6" }}>
                  {profile.name[0].toUpperCase()}
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: profile.avatarColor || "#3b82f6" }}>
                          {profile.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{profile.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold capitalize">{profile.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate("/projects"); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                        🏠 All Projects
                      </button>
                      <button onClick={() => { navigate(`/projects/${projectId}/settings`); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                        ⚙️ Settings
                      </button>
                      <button onClick={() => { toggle(); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                        {dark ? "☀️" : "🌙"} {dark ? "Light Mode" : "Dark Mode"}
                        <span className="ml-auto text-xs text-gray-400">{dark ? "On" : "Off"}</span>
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"/>
                      <button onClick={() => { localStorage.clear(); toast.success("Logged out!"); navigate("/projects"); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 transition-colors">
                        🚪 Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto dark:bg-gray-900">
            <Outlet/>
          </main>
        </div>
      </div>
    </div>
  );
}