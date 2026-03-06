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
//  PROJECT CARD
// ─────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  const color   = stringToColor(project.name);
  const tasks   = project.taskCount   || project.tasks?.length   || 0;
  const members = project.memberCount || project.members?.length || 0;
  const done    = project.doneCount   || 0;
  const pct     = tasks > 0 ? Math.round((done / tasks) * 100) : 0;
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: "1px solid " + (hov ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"),
        borderRadius: 18, padding: "22px 22px 18px", cursor: "pointer",
        transition: "all 0.2s", position: "relative", overflow: "hidden",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, " + color + ", transparent)", borderRadius: "18px 18px 0 0", opacity: hov ? 1 : 0.5, transition: "opacity 0.2s" }}/>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: color + "20", border: "1px solid " + color + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color, flexShrink: 0 }}>
          {project.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: hov ? "#a5d6ff" : "#e6edf3", margin: "0 0 3px", transition: "color 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</h3>
          {project.description && <p style={{ fontSize: 11, color: "#6e7681", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.description}</p>}
        </div>
        <span style={{ color: "#6e7681", fontSize: 16, flexShrink: 0, transition: "color 0.2s", color: hov ? "#a5d6ff" : "#6e7681" }}>→</span>
      </div>

      {tasks > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#6e7681" }}>Progress</span>
            <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, " + color + ", " + color + "88)", borderRadius: 999, transition: "width 0.8s ease" }}/>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 10, color: "#8b949e" }}>📋 {tasks} task{tasks !== 1 ? "s" : ""}</span>
          {members > 0 && <span style={{ fontSize: 10, color: "#8b949e" }}>👥 {members}</span>}
          {done > 0 && <span style={{ fontSize: 10, color: "#3fb950" }}>✅ {done} done</span>}
        </div>
        {project.createdAt && <span style={{ fontSize: 10, color: "#484f58" }}>{timeAgo(project.createdAt)}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  UNASSIGNED HOLDING PAGE
// ─────────────────────────────────────────────
function UnassignedPage({ user, logout }) {
  const rc   = ROLE_CONFIG[(user?.role || "").toLowerCase()] || ROLE_CONFIG.member;
  const dots = [0, 1, 2];

  return (
    <div style={{ minHeight: "100vh", background: "#080c18", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)", pointerEvents: "none" }}/>

      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>

        {/* Animated waiting icon */}
        <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto 28px" }}>
          <div style={{ width: 88, height: 88, borderRadius: 24, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            {rc.icon}
          </div>
          {/* Pulse rings */}
          <div style={{ position: "absolute", inset: -8, borderRadius: 32, border: "1px solid rgba(59,130,246,0.12)", animation: "pulse 2s ease-in-out infinite" }}/>
          <div style={{ position: "absolute", inset: -16, borderRadius: 40, border: "1px solid rgba(59,130,246,0.06)", animation: "pulse 2s ease-in-out infinite 0.5s" }}/>
          {/* Green dot */}
          <div style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: "#238636", border: "2px solid #080c18", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3fb950" }}/>
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          You&apos;re in! Just waiting...
        </h1>
        <p style={{ fontSize: 14, color: "#8b949e", lineHeight: 1.7, margin: "0 0 28px" }}>
          Hey <span style={{ color: "#e6edf3", fontWeight: 600 }}>{user?.name?.split(" ")[0]}</span>, your account is active.<br/>
          An admin will assign you to a project soon.
        </p>

        {/* Profile card */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Your Account</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: stringToColor(user?.name) + "33", border: "1px solid " + stringToColor(user?.name) + "55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: stringToColor(user?.name), flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3", margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: "#6e7681", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
            </div>
            <div style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 20, background: rc.badgeBg, color: rc.badgeColor, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
              {rc.icon} {rc.label}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{ background: "rgba(35,134,54,0.08)", border: "1px solid rgba(35,134,54,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3fb950", flexShrink: 0, boxShadow: "0 0 8px #3fb950" }}/>
          <p style={{ fontSize: 12, color: "#3fb950", margin: 0, fontWeight: 500 }}>Account active · Awaiting project assignment</p>
          {/* Animated dots */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {dots.map(i => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#3fb950", opacity: 0.4, animation: "blink 1.4s ease-in-out infinite", animationDelay: (i * 0.2) + "s" }}/>
            ))}
          </div>
        </div>

        <button onClick={logout}
          style={{ fontSize: 12, color: "#484f58", background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 8, transition: "color 0.2s", fontFamily: "inherit" }}
          onMouseEnter={e => e.target.style.color = "#8b949e"}
          onMouseLeave={e => e.target.style.color = "#484f58"}>
          Sign out
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
        @keyframes blink { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Projects() {
  const { user, token, logout } = useAuth();
  const navigate  = useNavigate();
  const [projects,    setProjects]    = useState([]);
  const [stats,       setStats]       = useState({ tasks: 0, members: 0, done: 0, inreview: 0, todo: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [search,      setSearch]      = useState("");

  const role    = (user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isDev   = role === "developer";
  const rc      = ROLE_CONFIG[role] || ROLE_CONFIG.member;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(API + "/api/projects", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        let tasks = 0, members = 0, done = 0, inreview = 0, todo = 0;
        list.forEach(p => {
          tasks    += p.taskCount     || p.tasks?.length   || 0;
          members  += p.memberCount   || p.members?.length || 0;
          done     += p.doneCount     || 0;
          inreview += p.inreviewCount || 0;
          todo     += p.todoCount     || 0;
        });
        setStats({ tasks, members, done, inreview, todo });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Unassigned non-admin with no projects ──
  if (!loading && !isAdmin && !isDev && projects.length === 0) {
    return <UnassignedPage user={user} logout={logout}/>;
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080c18", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "2px solid rgba(59,130,246,0.2)", borderTop: "2px solid #3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
        <p style={{ color: "#484f58", fontSize: 13, fontFamily: "system-ui" }}>Loading workspace…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Main Dashboard ──
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div style={{ minHeight: "100vh", background: "#080c18", color: "#e6edf3", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#161b22", color: "#e6edf3", border: "1px solid rgba(255,255,255,0.1)" }}}/>
      {showCreate && <CreateModal token={token} onClose={() => setShowCreate(false)} onCreate={p => setProjects(prev => [...prev, p])}/>}

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: 0, left: "30%", width: 800, height: 500, background: "radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }}/>

      {/* ── Top Nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,24,0.85)", backdropFilter: "blur(16px)", padding: "0 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>K</div>
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
              <ProjectCard key={p.id} project={p} onClick={() => navigate("/projects/" + p.id + "/board")}/>
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
    </div>
  );
}