import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#f59e0b",
  "#10b981","#ef4444","#06b6d4","#f97316",
];

const ICONS = ["K","P","A","B","C","D","E","F","G","H","M","N","Q","R","S","T","U","V","W","X","Y","Z"];

function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName]       = useState("");
  const [desc, setDesc]       = useState("");
  const [color, setColor]     = useState(COLORS[0]);
  const [icon, setIcon]       = useState("K");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Project name is required");
    setLoading(true);
    await onCreate({ name: name.trim(), description: desc.trim(), color, icon });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Create New Project</h2>
          <p className="text-xs text-gray-400 mt-0.5">Each project has its own board, timeline & team</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: color }}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{name || "Project name"}</p>
              <p className="text-xs text-gray-400">{desc || "Project description"}</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Project Name *</label>
            <input type="text" placeholder="e.g. My Kanban" value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"/>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea placeholder="What is this project about?" value={desc}
              onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none transition-all"/>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Icon Letter</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    icon === i ? "text-white shadow-sm scale-110" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={icon === i ? { background: color } : {}}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "scale-125 ring-2 ring-offset-2" : "hover:scale-110"}`}
                  style={{ background: c, ringColor: c }}/>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-all disabled:opacity-50 flex items-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</>
              : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/projects");
      setProjects(await res.json());
    } catch { toast.error("Failed to load projects"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    try {
      const res = await fetch("http://localhost:8000/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const project = await res.json();
        setProjects(prev => [{ ...project, taskCount: 0, memberCount: 0 }, ...prev]);
        setShowCreate(false);
        toast.success(`"${project.name}" created!`);
      } else toast.error("Failed to create project");
    } catch { toast.error("Failed to create project"); }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? All tasks and members will be removed.`)) return;
    try {
      await fetch(`http://localhost:8000/api/projects/${id}`, { method: "DELETE" });
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-gray-900">
      <Toaster position="top-right"/>
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate}/>}

      {/* Top bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">J</span>
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-white">Kanban Workspace</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
            </svg>
            <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs w-52 focus:outline-none focus:border-blue-400"/>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            + New Project
          </button>
        </div>
      </header>

      <main className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">Your Projects</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} · Click to open</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📋</div>
            <p className="text-gray-500 font-semibold">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Create your first project to get started</p>
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              + Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map((project, idx) => (
              <div key={project.id}
                onClick={() => navigate(`/projects/${project.id}/summary`)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                style={{ animationDelay: `${idx * 60}ms` }}>

                {/* Color accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: project.color }}/>

                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    style={{ background: project.color }}>
                    {project.icon}
                  </div>
                  <button
                    onClick={e => handleDelete(project.id, project.name, e)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all text-xs">
                    🗑️
                  </button>
                </div>

                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">{project.name}</h3>
                {project.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <span>📋</span>{project.taskCount} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👥</span>{project.memberCount} members
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </div>
              </div>
            ))}

            {/* Add project card */}
            <div onClick={() => setShowCreate(true)}
              className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xl">+</div>
              <p className="text-sm font-semibold text-gray-400">New Project</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}