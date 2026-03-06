import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Robust isActive check — handles TINYINT 0, boolean false, and null
const isActiveUser = (a) => a.isActive !== 0 && a.isActive !== false && a.isActive !== null;

const ROLES = ["admin", "developer", "member", "intern"];
const ROLE_META = {
  admin:     { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300",    icon: "👑", desc: "Full access — manage everything" },
  developer: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", icon: "💻", desc: "Create/edit tasks, assign work" },
  member:    { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-300",   icon: "👤", desc: "View everything, update status only" },
  intern:    { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-300",  icon: "🌱", desc: "View + create own tasks only" },
};

const EMPLOYMENT_TYPES = [
  "Full-Time", "Part-Time", "Contract", "Freelance", "Internship", "Apprenticeship",
];

const DEPARTMENTS = [
  "Frontend Engineering","Backend Engineering","Full Stack Engineering","Mobile Development",
  "DevOps & Infrastructure","Cloud Engineering","Platform Engineering","Embedded Systems",
  "QA & Testing","Security Engineering","Product Management","UX Design","UI Design",
  "Product Design","Design Systems","Data Engineering","Data Science","Machine Learning",
  "AI Research","Business Intelligence","Analytics","Project Management","Scrum / Agile",
  "Technical Writing","Customer Success","Sales Engineering","Marketing Technology",
  "Finance & Operations","Research & Development","IT Support","HR Technology","Legal & Compliance",
];

function stringToColor(str = "") {
  const c = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

function timeAgo(date) {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)     return "just now";
  if (s < 3600)   return `${Math.floor(s/60)}m ago`;
  if (s < 86400)  return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

// ── Edit Account Modal ──
function EditModal({ account, onClose, onSave, onToggle, isSelf }) {
  const [role,           setRole]           = useState((account.role || "member").toLowerCase());
  const [department,     setDepartment]     = useState(account.department || "");
  const [level,          setLevel]          = useState(account.level || "");
  const [employmentType, setEmploymentType] = useState(account.internType || account.employmentType || "");
  const [saving,         setSaving]         = useState(false);
  const [toggling,       setToggling]       = useState(false);
  const [confirm,        setConfirm]        = useState(false);
  const isActive = isActiveUser(account);
  const rm = ROLE_META[role] || ROLE_META.member;

  const handleSave = async () => {
    setSaving(true);
    await onSave(account.id, role, department, employmentType, level);
    setSaving(false);
  };

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(account);
    setToggling(false);
    setConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: account.avatarColor || stringToColor(account.name) }}>
            {account.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">{account.name}</h2>
            <p className="text-xs text-gray-400 truncate">{account.email}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-400"}`}/>
              <span className={`text-[10px] font-semibold ${isActive ? "text-green-600" : "text-red-500"}`}>
                {isActive ? "Active" : "Deactivated"}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">Joined {timeAgo(account.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Role selector */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-3">Assign Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => {
                const meta = ROLE_META[r];
                const selected = role === r;
                return (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? `${meta.bg} ${meta.border} ${meta.text}`
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-700"
                    }`}>
                    <span className="text-base flex-shrink-0 mt-0.5">{meta.icon}</span>
                    <div>
                      <p className={`text-xs font-bold capitalize ${selected ? meta.text : "text-gray-700 dark:text-gray-200"}`}>{r}</p>
                      <p className={`text-[9px] leading-snug mt-0.5 ${selected ? meta.text + " opacity-80" : "text-gray-400"}`}>{meta.desc}</p>
                    </div>
                    {selected && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permission summary */}
          <div className={`p-3 rounded-xl border ${rm.bg} ${rm.border}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${rm.text}`}>
              {rm.icon} {role} permissions
            </p>
            <ul className={`text-[10px] space-y-0.5 ${rm.text} opacity-80`}>
              {role === "admin"     && <><li>✅ Manage all projects & users</li><li>✅ Create, edit, delete any task</li><li>✅ Activate/deactivate accounts</li><li>✅ Assign roles to team members</li></>}
              {role === "developer" && <><li>✅ Create & edit any task</li><li>✅ Assign tasks to interns</li><li>✅ Review intern work (approve/reject)</li><li>❌ Cannot delete projects or users</li></>}
              {role === "member"    && <><li>✅ View all tasks & projects</li><li>✅ Update task status only</li><li>❌ Cannot create or delete tasks</li><li>❌ No admin access</li></>}
              {role === "intern"    && <><li>✅ View all tasks</li><li>✅ Create & manage own tasks</li><li>✅ Move own tasks on board</li><li>❌ Cannot delete or access admin</li></>}
            </ul>
          </div>

          {/* Department + Employment Type */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profile Details</p>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Level</label>
              <div className="flex flex-wrap gap-1.5">
                {["Intern","Junior","Mid","Senior","Lead"].map(lv => (
                  <button key={lv} onClick={() => setLevel(lv === level ? "" : lv)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                      level === lv
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100"
                    }`}>
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Employment Type</label>
              <div className="flex flex-wrap gap-1.5">
                {EMPLOYMENT_TYPES.map(et => (
                  <button key={et} onClick={() => setEmploymentType(et === employmentType ? "" : et)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                      employmentType === et
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100"
                    }`}>
                    {et}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                <option value="">Select department...</option>
                <optgroup label="── Engineering ──">{DEPARTMENTS.slice(0,10).map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="── Product & Design ──">{DEPARTMENTS.slice(10,15).map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="── Data & AI ──">{DEPARTMENTS.slice(15,21).map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="── Business ──">{DEPARTMENTS.slice(21,28).map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="── Other ──">{DEPARTMENTS.slice(28).map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between rounded-b-2xl">
          {/* Activate / Deactivate */}
          {isSelf ? (
            <span className="text-xs text-gray-400 italic">Cannot modify your own account</span>
          ) : !confirm ? (
            <button onClick={() => setConfirm(true)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                isActive
                  ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                  : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
              }`}>
              {isActive ? "🚫 Deactivate Account" : "✅ Activate Account"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">{isActive ? "Deactivate?" : "Activate?"}</span>
              <button onClick={handleToggle} disabled={toggling}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg text-white ${isActive ? "bg-red-500" : "bg-green-500"} disabled:opacity-50`}>
                {toggling ? "..." : "Yes"}
              </button>
              <button onClick={() => setConfirm(false)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-200 text-gray-600">No</button>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving || isSelf}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2">
              {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : "Save Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdminAccounts() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [accounts,     setAccounts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterRole,   setFilterRole]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editAccount,  setEditAccount]  = useState(null);

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/admin/accounts`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setAccounts(Array.isArray(data) ? data : []);
      else toast.error(data.message || "Failed to load");
    } catch { toast.error("Cannot connect to server"); }
    setLoading(false);
  };

  useEffect(() => { if (token && isAdmin) load(); }, [token]);

  const handleSaveRole = async (id, role, department, employmentType, level) => {
    try {
      // Save role
      const res = await fetch(`${API}/api/auth/admin/accounts/${id}/role`, {
        method: "PATCH", headers: authHeaders, body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed"); return; }

      // Save profile details (department + employmentType)
      if (department !== undefined || employmentType !== undefined) {
        await fetch(`${API}/api/auth/admin/accounts/${id}/profile`, {
          method: "PATCH", headers: authHeaders,
          body: JSON.stringify({ department, employmentType, level }),
        }).catch(() => {});
      }

      setAccounts(prev => prev.map(a =>
        a.id === id ? { ...a, role, department, internType: employmentType, level } : a
      ));
      setEditAccount(null);
      toast.success(`${data.user?.name || "User"} updated — ${role}${level ? " · " + level : ""}${department ? " · " + department : ""}${employmentType ? " · " + employmentType : ""}`);
    } catch { toast.error("Failed"); }
  };

  const handleToggle = async (account) => {
    const action = isActiveUser(account) ? "deactivate" : "activate";
    try {
      const res  = await fetch(`${API}/api/auth/admin/accounts/${account.id}/${action}`, {
        method: "PATCH", headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, isActive: action === "activate" } : a));
        setEditAccount(null);
        toast.success(data.message);
      } else toast.error(data.message || "Failed");
    } catch { toast.error("Failed"); }
  };

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch   = !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    const matchRole     = !filterRole   || (a.role || "").toLowerCase() === filterRole;
    const matchStatus   = !filterStatus || (filterStatus === "active" ? isActiveUser(a) : !isActiveUser(a));
    return matchSearch && matchRole && matchStatus;
  });

  const totalActive   = accounts.filter(a => isActiveUser(a)).length;
  const totalInactive = accounts.filter(a => !isActiveUser(a)).length;

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-4xl">🔒</p>
      <p className="text-sm font-semibold text-gray-500">Admin access only</p>
    </div>
  );

  return (
    <div className="p-6 dark:bg-gray-900 min-h-full">
      <Toaster position="top-right"/>

      {editAccount && (
        <EditModal
          account={editAccount}
          isSelf={editAccount.id === user?.id}
          onClose={() => setEditAccount(null)}
          onSave={handleSaveRole}
          onToggle={handleToggle}
        />
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Account Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Assign roles and control access for all registered workspace members
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Accounts", value: accounts.length, icon: "👥", color: "text-blue-600",  bg: "bg-blue-50"  },
          { label: "Active",         value: totalActive,     icon: "✅", color: "text-green-600", bg: "bg-green-50" },
          { label: "Deactivated",    value: totalInactive,   icon: "🚫", color: "text-red-600",   bg: "bg-red-50"   },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {ROLES.map(r => {
          const m = ROLE_META[r];
          return (
            <div key={r} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${m.bg} ${m.border}`}>
              <span>{m.icon}</span>
              <div>
                <p className={`text-[10px] font-bold capitalize ${m.text}`}>{r}</p>
                <p className={`text-[9px] ${m.text} opacity-70`}>{m.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
          </svg>
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs w-full focus:outline-none focus:border-blue-400"/>
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:outline-none">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].icon} {r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:outline-none">
          <option value="">All Status</option>
          <option value="active">✅ Active</option>
          <option value="inactive">🚫 Deactivated</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{filtered.length} of {accounts.length}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {["User", "Role", "Joined", "Status", "Action"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-xs text-gray-400">
                  {loading ? "Loading..." : accounts.length === 0 ? "No accounts registered yet" : "No accounts match your filters"}
                </td></tr>
              )}
              {filtered.map(account => {
                const role     = (account.role || "member").toLowerCase();
                const rm       = ROLE_META[role] || ROLE_META.member;
                const isSelf   = account.id === user?.id;
                const isActive = isActiveUser(account);

                return (
                  <tr key={account.id}
                    className={`border-b border-gray-50 dark:border-gray-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!isActive ? "opacity-55" : ""}`}>

                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: account.avatarColor || stringToColor(account.name) }}>
                          {account.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-gray-800 dark:text-white">{account.name}</p>
                            {isSelf && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-semibold">You</span>}
                          </div>
                          <p className="text-[10px] text-gray-400">{account.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${rm.bg} ${rm.text}`}>
                        {rm.icon} {role}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">#{account.id}</p>
                      <p className="text-[10px] text-gray-400">{timeAgo(account.createdAt)}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-400"}`}/>
                        <span className={`text-[10px] font-semibold ${isActive ? "text-green-600" : "text-red-500"}`}>
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setEditAccount(account)}
                        className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 dark:border-gray-600 transition-all">
                        ✏️ Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info banner */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-700 font-medium">
          ⚠️ Deactivating blocks login immediately. Deactivated users can re-register with the same email.
          You cannot deactivate your own account. Click <strong>Manage</strong> on any row to assign a role or toggle access.
        </p>
      </div>
    </div>
  );
}