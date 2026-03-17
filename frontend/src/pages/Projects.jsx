import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function stringToColor(str) {
  str = str || "";
  const c = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

function timeAgo(date) {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  return Math.floor(s/86400) + "d ago";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ROLE_CONFIG = {
  admin:     { label: "Administrator", badgeColor: "#ef4444",  badgeBg: "rgba(239,68,68,0.15)",    icon: "👑" },
  developer: { label: "Developer",     badgeColor: "#a78bfa",  badgeBg: "rgba(167,139,250,0.15)",   icon: "💻" },
  member:    { label: "Member",        badgeColor: "#60a5fa",  badgeBg: "rgba(96,165,250,0.15)",    icon: "👤" },
  intern:    { label: "Intern",        badgeColor: "#34d399",  badgeBg: "rgba(52,211,153,0.15)",    icon: "🌱" },
};

// ─────────────────────────────────────────────
//  CREATE PROJECT MODAL
// ─────────────────────────────────────────────
function CreateModal({ token, onClose, onCreate }) {
  const [name,   setName]   = useState("");
  const [desc,   setDesc]   = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!name.trim()) return toast.error("Project name required");
    setSaving(true);
    try {
      const res  = await fetch(API + "/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Project created!"); onCreate(data); onClose(); }
      else toast.error(data.message || "Failed");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📁</div>
            <span style={{ color: "#f0f6fc", fontWeight: 700, fontSize: 15 }}>New Project</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", color: "#6e7681", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Project Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()}
              placeholder="e.g. Mobile App Redesign"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#f0f6fc", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}/>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="What is this project about?"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#f0f6fc", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}/>
          </div>
        </div>
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#8b949e", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handle} disabled={saving}
            style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: saving ? "rgba(59,130,246,0.4)" : "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? "Creating…" : "Create Project →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, " + color + "80, transparent)", borderRadius: "16px 16px 0 0" }}/>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }}/>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.02em", margin: "0 0 3px" }}>{value}</p>
      <p style={{ fontSize: 11, color: "#6e7681", margin: 0 }}>{label}</p>
      {sub && <p style={{ fontSize: 10, color: color + "99", margin: "4px 0 0", fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  PROJECT CARD (WITH DELETE BUTTON)
// ─────────────────────────────────────────────
function ProjectCard({ project, onClick, onDelete, isAdmin }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete");
      }

      toast.success(`"${data.projectName}" deleted successfully`);
      if (onDelete) onDelete(project.id);

    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const color = stringToColor(project.name);

  return (
    <div onClick={showDeleteConfirm ? undefined : onClick}
      style={{ 
        position: "relative",
        background: "rgba(255,255,255,0.025)", 
        border: "1px solid rgba(255,255,255,0.07)", 
        borderRadius: 18, 
        padding: "20px", 
        cursor: "pointer", 
        overflow: "hidden", 
        transition: "all 0.2s" 
      }}
      onMouseEnter={e => !showDeleteConfirm && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)", e.currentTarget.style.background = "rgba(255,255,255,0.035)")}
      onMouseLeave={e => !showDeleteConfirm && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)", e.currentTarget.style.background = "rgba(255,255,255,0.025)")}>
      
      {/* Top gradient bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, " + color + "AA, transparent)" }}/>
      
      {/* Header with icon and delete button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: 12, 
          background: color + "22", 
          border: "1px solid " + color + "44", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          fontSize: 18, 
          fontWeight: 700, 
          color 
        }}>
          {project.name?.[0]?.toUpperCase() || "P"}
        </div>

        {/* Delete Button - Admin Only */}
        {isAdmin && (
          <button
            onClick={handleDeleteClick}
            style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 8, 
              border: "1px solid rgba(255,255,255,0.08)", 
              background: "rgba(255,255,255,0.04)", 
              color: "#6e7681", 
              cursor: "pointer", 
              fontSize: 14, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#6e7681"; }}>
            🗑️
          </button>
        )}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e6edf3", margin: "0 0 6px", lineHeight: 1.3 }}>
        {project.name}
      </h3>
      <p style={{ fontSize: 12, color: "#6e7681", margin: "0 0 16px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {project.description || "No description"}
      </p>

      {/* Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#484f58" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          📋 {project.taskCount || 0}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          👥 {project.memberCount || 0}
        </span>
        <span style={{ marginLeft: "auto", color: "#484f58" }}>
          {timeAgo(project.createdAt)}
        </span>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: "absolute", 
            inset: 0, 
            background: "rgba(13,17,23,0.98)", 
            borderRadius: 18, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: 20, 
            zIndex: 10,
            backdropFilter: "blur(8px)"
          }}>
          <div style={{ textAlign: "center", maxWidth: "100%" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", margin: "0 0 8px" }}>
              Delete Project?
            </h4>
            <p style={{ fontSize: 11, color: "#8b949e", margin: "0 0 4px", lineHeight: 1.5 }}>
              This will permanently delete:
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", margin: "0 0 8px" }}>
              "{project.name}"
            </p>
            <p style={{ fontSize: 10, color: "#6e7681", margin: "0 0 16px" }}>
              All tasks, members, and data will be lost!
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                style={{ 
                  padding: "7px 14px", 
                  borderRadius: 8, 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  background: "rgba(255,255,255,0.04)", 
                  color: "#8b949e", 
                  fontSize: 12, 
                  cursor: "pointer", 
                  fontFamily: "inherit",
                  opacity: deleting ? 0.5 : 1
                }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ 
                  padding: "7px 14px", 
                  borderRadius: 8, 
                  border: "none", 
                  background: deleting ? "rgba(239,68,68,0.5)" : "#ef4444", 
                  color: "#fff", 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: "pointer", 
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                {deleting ? (
                  <>
                    <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>
                    Deleting...
                  </>
                ) : (
                  <>🗑️ Delete Forever</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Projects() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects,    setProjects]    = useState([]);
  const [stats,       setStats]       = useState({ tasks: 0, todo: 0, inprogress: 0, inreview: 0, done: 0 });
  const [showCreate,  setShowCreate]  = useState(false);
  const [search,      setSearch]      = useState("");

  const token     = localStorage.getItem("token");
  const firstName = (user?.name || "").split(" ")[0];
  const isAdmin   = user?.role === "admin";
  const isDev     = user?.role === "developer";
  const rc        = ROLE_CONFIG[user?.role] || ROLE_CONFIG.member;

  useEffect(() => {
    if (!token) return navigate("/login");
    fetchProjects();
    if (isAdmin) fetchStats();
  }, [token, navigate, isAdmin]);

  const fetchProjects = async () => {
    try {
      const res  = await fetch(API + "/api/projects", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (res.ok) setProjects(data);
      else console.error(data.message);
    } catch (err) { console.error("Failed to fetch projects:", err); }
  };

  const fetchStats = async () => {
    try {
      const res  = await fetch(API + "/api/tasks/stats", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (res.ok) setStats({ tasks: data.total || 0, todo: data.todo || 0, inprogress: data.inprogress || 0, inreview: data.inreview || 0, done: data.done || 0 });
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const handleProjectCreated = (newProj) => {
    setProjects(prev => [...prev, newProj]);
  };

  const handleProjectDeleted = (deletedId) => {
    setProjects(prev => prev.filter(p => p.id !== deletedId));
  };

  const filtered = search.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#e6edf3", fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
      <Toaster position="top-center" toastOptions={{ style: { background: "#161b22", color: "#e6edf3", border: "1px solid rgba(255,255,255,0.1)" } }}/>

      {/* ── Background Effect ── */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at 50% 20%, rgba(56,139,253,0.08) 0%, transparent 50%)", pointerEvents: "none" }}/>

      {/* ── Header ── */}
      <header style={{ background: "rgba(22,27,34,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📊</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#c9d1d9" }}>Kanban Workspace</span>
            <div style={{ padding: "3px 10px", borderRadius: 20, background: rc.badgeBg, color: rc.badgeColor, fontSize: 10, fontWeight: 700 }}>
              {rc.icon} {rc.label}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isAdmin && (
              <button onClick={() => setShowCreate(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 10, border: "none", background: "#1f6feb", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + New Project
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: stringToColor(user?.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: "#8b949e" }}>{user?.name}</span>
            </div>
            <button onClick={logout} style={{ fontSize: 11, color: "#484f58", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 8px", borderRadius: 8 }}
              onMouseEnter={e => e.target.style.color = "#8b949e"} onMouseLeave={e => e.target.style.color = "#484f58"}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 28px 60px", position: "relative", zIndex: 1 }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: "#484f58", margin: "0 0 4px" }}>{greeting()},</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px", background: "linear-gradient(135deg, #e6edf3 0%, #8b949e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {firstName} 👋
          </h1>
          <p style={{ fontSize: 13, color: "#484f58", margin: 0 }}>
            {isAdmin ? "Here's your workspace at a glance." : isDev ? "Your active projects and work." : "Your assigned projects."}
          </p>
        </div>

        {/* ── Admin Stats ── */}
        {isAdmin && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
            <StatCard icon="📁" label="Total Projects" value={projects.length}  color="#3b82f6"  sub={projects.length > 0 ? projects.length + " active" : "No projects yet"}/>
            <StatCard icon="📋" label="Total Tasks"    value={stats.tasks}      color="#a78bfa"  sub={stats.todo > 0 ? stats.todo + " to do" : undefined}/>
            <StatCard icon="🔍" label="In Review"      value={stats.inreview}   color="#f59e0b"  sub={stats.inreview > 0 ? "Needs attention" : "All clear!"}/>
            <StatCard icon="🎯" label="Completed"      value={stats.done}       color="#3fb950"  sub={stats.tasks > 0 ? Math.round((stats.done / stats.tasks) * 100) + "% done overall" : undefined}/>
          </div>
        )}

        {/* ── Projects Section ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px", color: "#c9d1d9" }}>
              {isAdmin ? "All Projects" : "Your Projects"}
            </h2>
            <p style={{ fontSize: 11, color: "#484f58", margin: 0 }}>
              {filtered.length} project{filtered.length !== 1 ? "s" : ""} · click to open
            </p>
          </div>
          {projects.length > 2 && (
            <div style={{ position: "relative" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 12px 7px 30px", fontSize: 12, color: "#c9d1d9", outline: "none", width: 160, fontFamily: "inherit" }}/>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#484f58" }}>🔍</span>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#484f58" }}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>📂</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#6e7681", margin: "0 0 6px" }}>No projects yet</p>
            {isAdmin && <p style={{ fontSize: 13 }}>Create your first project to get started.</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {filtered.map(p => (
              <ProjectCard 
                key={p.id} 
                project={p} 
                onClick={() => navigate("/projects/" + p.id + "/board")}
                onDelete={handleProjectDeleted}
                isAdmin={isAdmin}
              />
            ))}

            {/* "New Project" ghost card — admin only */}
            {isAdmin && (
              <div onClick={() => setShowCreate(true)}
                style={{ background: "transparent", border: "2px dashed rgba(255,255,255,0.06)", borderRadius: 18, padding: "22px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160, gap: 10, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.background = "rgba(59,130,246,0.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#484f58" }}>+</div>
                <p style={{ fontSize: 12, color: "#484f58", margin: 0, fontWeight: 600 }}>New Project</p>
              </div>
            )}
          </div>
        )}

        {/* ── Quick Actions (admin, first project) ── */}
        {isAdmin && projects.length > 0 && (
          <div style={{ marginTop: 44, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Quick Actions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { label: "Manage Accounts", icon: "👥", path: "/projects/" + projects[0].id + "/accounts" },
                { label: "Board",           icon: "📋", path: "/projects/" + projects[0].id + "/board" },
                { label: "Summary",         icon: "📊", path: "/projects/" + projects[0].id + "/summary" },
                { label: "Timeline",        icon: "📅", path: "/projects/" + projects[0].id + "/timeline" },
                { label: "Team",            icon: "🧑‍🤝‍🧑", path: "/projects/" + projects[0].id + "/team" },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", color: "#8b949e", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; e.currentTarget.style.color = "#e6edf3"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#8b949e"; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}>
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Create Modal ── */}
      {showCreate && <CreateModal token={token} onClose={() => setShowCreate(false)} onCreate={handleProjectCreated}/>}
    </div>
  );
}