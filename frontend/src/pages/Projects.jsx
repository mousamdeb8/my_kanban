// File: frontend/src/pages/Projects.jsx  
// Action: REPLACE EXISTING FILE
// Changes: 
// 1. Modern light/gradient color scheme
// 2. Dynamic time-based greeting
// 3. Cleaner, more modern design

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Projects() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, tasks: 0, inReview: 0, completed: 0 });
  const [showMenu, setShowMenu] = useState(false);

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);

        const total = list.length;
        const active = list.filter((p) => p.status === "active").length;
        const tasks = list.reduce((sum, p) => sum + (p.taskCount || 0), 0);
        const inReview = 0;
        const completed = 0;

        setStats({ total, active, tasks, inReview, completed });
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  const avatarSrc = user?.avatarUrl ? `${API}${user.avatarUrl}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Kanban Workspace</h1>
              <p className="text-xs text-gray-500">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Administrator
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/achievements")}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            >
              🏆 Achievements
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-500"
                    style={{ background: user?.avatarColor || "#3b82f6" }}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                    >
                      👤 My Profile
                    </button>
                    <button
                      onClick={() => navigate("/achievements")}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                    >
                      🏆 Achievements
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 font-medium flex items-center gap-2"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">{getGreeting()},</p>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            {user?.name} 👋
          </h2>
          <p className="text-gray-600 mt-1">Here's your workspace at a glance.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { icon: "📁", value: stats.total, label: "Total Projects", sub: `${stats.active} active`, gradient: "from-blue-500 to-blue-600" },
            { icon: "📋", value: stats.tasks, label: "Total Tasks", sub: "All projects", gradient: "from-purple-500 to-purple-600" },
            { icon: "🔍", value: stats.inReview, label: "In Review", sub: "All clear!", gradient: "from-orange-500 to-orange-600" },
            { icon: "✅", value: stats.completed, label: "Completed", sub: "this week", gradient: "from-green-500 to-green-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs font-semibold text-gray-700">{stat.label}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Your Projects</h3>
            <p className="text-sm text-gray-500">
              {projects.length} project{projects.length !== 1 ? "s" : ""} · click to open
            </p>
          </div>
          <button
            onClick={() => toast("Create project feature coming soon!")}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            + New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}/summary`)}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform"
                  style={{ background: project.color }}
                >
                  {project.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base mb-1 truncate group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      📋 <strong>{project.taskCount || 0}</strong> tasks
                    </span>
                    <span className="flex items-center gap-1">
                      👥 <strong>{project.memberCount || 0}</strong> members
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Project Card */}
          <div
            onClick={() => toast("Create project feature coming soon!")}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <span className="text-3xl">+</span>
              </div>
              <p className="font-semibold text-gray-700">New Project</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}