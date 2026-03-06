import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ROLE_BADGE = {
  admin:     "bg-red-100 text-red-700",
  developer: "bg-purple-100 text-purple-700",
  member:    "bg-blue-100 text-blue-700",
  intern:    "bg-green-100 text-green-700",
};

const LEVEL_BADGE = {
  intern: "bg-green-50 text-green-600",
  junior: "bg-blue-50 text-blue-600",
  mid:    "bg-yellow-50 text-yellow-600",
  senior: "bg-orange-50 text-orange-600",
  lead:   "bg-red-50 text-red-600",
};

function Avatar({ user, size = "md" }) {
  const sz = size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  if (user?.avatarUrl)
    return <img src={`${API}${user.avatarUrl}`} alt={user.name}
      className={`${sz} rounded-full object-cover ring-2 ring-white shadow`}/>;
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white shadow`}
      style={{ background: user?.avatarColor || "#3b82f6" }}>
      {user?.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function AddMemberModal({ projectId, token, onClose, onAdded }) {
  const [available, setAvailable] = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(null);

  useEffect(() => {
    fetch(`${API}/api/projects/${projectId}/available-users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setAvailable(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addUser = async (userId, userName) => {
    setAdding(userId);
    try {
      const res  = await fetch(`${API}/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${userName} added to project!`);
        setAvailable(prev => prev.filter(u => u.id !== userId));
        onAdded(data);
      } else {
        toast.error(data.message || "Failed to add");
      }
    } catch { toast.error("Server error"); }
    finally { setAdding(null); }
  };

  const filtered = available.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Add Team Member</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select a registered user to give project access</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">✕</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/>
            </svg>
            <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-400"/>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-400 text-sm">{available.length === 0 ? "All registered users are already members" : "No users match your search"}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Avatar user={user}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${ROLE_BADGE[user.role] || "bg-gray-100 text-gray-600"}`}>{user.role}</span>
                      {user.level && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${LEVEL_BADGE[user.level] || ""}`}>{user.level}</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    {user.jobTitle && <p className="text-xs text-gray-400 truncate">💼 {user.jobTitle}</p>}
                  </div>
                  <button onClick={() => addUser(user.id, user.name)} disabled={adding === user.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {adding === user.id
                      ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      : "+ Add"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            💡 Only registered users appear here. New users must register first, then admin can add them.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeamMembers() {
  const { projectId } = useParams();
  const { user, token } = useAuth();

  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [removing,   setRemoving]   = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetch(`${API}/api/projects/${projectId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setMembers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  const removeMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    setRemoving(userId);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== userId));
        toast.success(`${name} removed`);
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed");
      }
    } catch { toast.error("Server error"); }
    finally { setRemoving(null); }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-full">
      <Toaster position="top-right"/>
      {showAdd && (
        <AddMemberModal
          projectId={projectId}
          token={token}
          onClose={() => setShowAdd(false)}
          onAdded={(newMember) => { setMembers(prev => [...prev, newMember]); }}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Team Members</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {members.length} member{members.length !== 1 ? "s" : ""} with access to this project
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              + Add Member
            </button>
          )}
        </div>

        {/* Info banner for non-admins */}
        {!isAdmin && (
          <div className="mb-5 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <span className="text-lg">ℹ️</span>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Only admins can add or remove team members. Contact your admin to make changes.
            </p>
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
            <p className="font-semibold text-gray-600 dark:text-gray-300">No members yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {isAdmin ? "Add team members to give them access to this project." : "No one has been added to this project yet."}
            </p>
            {isAdmin && (
              <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                + Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center gap-4 group hover:shadow-sm transition-all">
                <Avatar user={member} size="lg"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{member.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[member.role] || "bg-gray-100 text-gray-600"}`}>
                      {member.role}
                    </span>
                    {member.level && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${LEVEL_BADGE[member.level] || ""}`}>
                        {member.level}
                      </span>
                    )}
                    {member.id === user?.id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {member.jobTitle   && <span className="text-xs text-gray-500">💼 {member.jobTitle}</span>}
                    {member.department && <span className="text-xs text-gray-500">🏢 {member.department}</span>}
                    {member.joinedProjectAt && (
                      <span className="text-xs text-gray-400">
                        Joined {new Date(member.joinedProjectAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button — admin only, can't remove yourself */}
                {isAdmin && member.id !== user?.id && (
                  <button onClick={() => removeMember(member.id, member.name)}
                    disabled={removing === member.id}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5">
                    {removing === member.id
                      ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"/>
                      : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RBAC reminder */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">What each role can do in this project</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role:"admin",     can:["Everything"],                              cannot:[] },
              { role:"developer", can:["Create & edit tasks","Update status"],     cannot:["Delete projects","Manage users"] },
              { role:"member",    can:["View boards","Update task status"],         cannot:["Create tasks","Delete anything"] },
              { role:"intern",    can:["Create own tasks","Edit own tasks"],        cannot:["Delete tasks","Manage others"] },
            ].map(r => (
              <div key={r.role} className={`p-3 rounded-xl border ${r.role === user?.role ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10" : "border-gray-100 dark:border-gray-700"}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[r.role]}`}>{r.role}</span>
                  {r.role === user?.role && <span className="text-[10px] text-blue-500 font-semibold">← you</span>}
                </div>
                {r.can.map(c  => <p key={c} className="text-[11px] text-green-600 dark:text-green-400">✓ {c}</p>)}
                {r.cannot.map(c => <p key={c} className="text-[11px] text-gray-400 dark:text-gray-500">✗ {c}</p>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}