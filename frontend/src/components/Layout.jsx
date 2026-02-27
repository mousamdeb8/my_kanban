import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/summary", label: "Summary",  icon: "⊞" },
  { path: "/board",   label: "Board",    icon: "▦" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">

        {/* Project header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 leading-tight">My Kanban</p>
              <p className="text-[10px] text-gray-400">Software project</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: team members placeholder */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Project</p>
          <p className="text-xs text-gray-500">My Kanban Board</p>
          <p className="text-[10px] text-gray-400 mt-1">v1.0 · In development</p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Projects</span>
            <span>/</span>
            <span className="text-gray-600 font-medium">My Kanban</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
              </svg>
              <input
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-xs w-48 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}