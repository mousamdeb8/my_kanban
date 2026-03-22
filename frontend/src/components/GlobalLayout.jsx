// File: frontend/src/components/GlobalLayout.jsx
// Action: NEW FILE
// Purpose: Provides navigation for Profile and Achievements pages

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function GlobalLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  const avatarSrc = user?.avatarUrl ? `${API}${user.avatarUrl}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header - Same as Projects page */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo + Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                K
              </div>
              <div className="text-left">
                <h1 className="text-lg font-bold text-gray-900">Kanban Workspace</h1>
                <p className="text-xs text-gray-500">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  Administrator
                </p>
              </div>
            </button>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-4">
            {/* Quick Links */}
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              🏠 Projects
            </button>
            <button
              onClick={() => navigate("/achievements")}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              🏆 Achievements
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              👤 Profile
            </button>

            {/* User Menu */}
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
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate("/projects");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                    >
                      🏠 All Projects
                    </button>
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                    >
                      👤 My Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/achievements");
                        setShowMenu(false);
                      }}
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
      <main>{children}</main>
    </div>
  );
}