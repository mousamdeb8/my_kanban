import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#22c55e","#ef4444","#f97316","#eab308","#14b8a6"
];

const DEPARTMENTS = [
  "Frontend Engineering","Backend Engineering","Full Stack Engineering","Mobile Engineering",
  "DevOps / Cloud","Platform Engineering","Embedded Systems","QA Engineering","Security Engineering",
  "Product Management","UX Design","UI Design","Product Design","Design Systems",
  "Data Engineering","Data Science","Machine Learning","AI Research","Business Intelligence","Analytics",
  "Project Management","Scrum / Agile","Technical Writing","Customer Success",
  "Sales Engineering","Marketing Technology","Finance & Operations",
  "R&D","IT Support","HR Technology","Legal & Compliance","Other"
];

const LEVELS    = ["Intern","Junior","Mid","Senior","Lead"];
const EMP_TYPES = ["Full-Time","Part-Time","Remote","Contract","Freelance","Internship","Apprenticeship"];

// Fields locked by admin — non-admins cannot edit these
const ADMIN_LOCKED_FIELDS = ["role","department","level","employmentType"];

export default function Settings() {
  const { user, token, updateUser } = useAuth();
  const fileRef = useRef();

  const role    = (user?.role || "member").toLowerCase();
  const isAdmin = role === "admin";
  // Non-admins can edit: name, email, avatar, bio, jobTitle, skills, joinedDate, mentor
  // Role/department/level/employmentType are READ-ONLY for non-admins (set by admin)

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // ── Profile state ──
  const [activeTab,      setActiveTab]      = useState("profile");
  const [name,           setName]           = useState(user?.name || "");
  const [email,          setEmail]          = useState(user?.email || "");
  const [avatarColor,    setAvatarColor]    = useState(user?.avatarColor || "#3b82f6");
  const [avatarUrl,      setAvatarUrl]      = useState(user?.avatarUrl || null);
  const [jobTitle,       setJobTitle]       = useState(user?.jobTitle || "");
  const [bio,            setBio]            = useState(user?.bio || "");
  const [skills,         setSkills]         = useState(user?.skills || "");
  const [joinedDate,     setJoinedDate]     = useState(user?.joinedDate || "");
  const [mentorId,       setMentorId]       = useState(user?.mentorId || "");
  const [allUsers,       setAllUsers]       = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState(false);

  // Read-only display values for non-admins (set by admin)
  const displayRole       = user?.role       || "member";
  const displayDept       = user?.department || null;
  const displayLevel      = user?.level      || null;
  const displayEmpType    = user?.internType || user?.employmentType || null;

  // Admin-only editable fields (admins can change their own)
  const [adminDept,    setAdminDept]    = useState(user?.department || "");
  const [adminLevel,   setAdminLevel]   = useState(user?.level || "");
  const [adminEmpType, setAdminEmpType] = useState(user?.internType || user?.employmentType || "");

  // ── Password state ──
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // Load mentor options
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setAllUsers(d) : null)
      .catch(() => {});
  }, [token]);

  // Keep local state fresh when user context updates
  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    setAvatarColor(user.avatarColor || "#3b82f6");
    setAvatarUrl(user.avatarUrl || null);
    setJobTitle(user.jobTitle || "");
    setBio(user.bio || "");
    setSkills(user.skills || "");
    setJoinedDate(user.joinedDate || "");
    setMentorId(user.mentorId || "");
    setAdminDept(user.department || "");
    setAdminLevel(user.level || "");
    setAdminEmpType(user.internType || user.employmentType || "");
  }, [user?.id]);

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const body = {
        name:       name.trim(),
        email:      email.trim(),
        avatarColor,
        jobTitle:   jobTitle.trim() || null,
        bio:        bio.trim() || null,
        skills:     skills.trim() || null,
        joinedDate: joinedDate || null,
        mentorId:   mentorId ? Number(mentorId) : null,
        // Admins can edit their own org fields
        ...(isAdmin ? {
          department:     adminDept || null,
          level:          adminLevel || null,
          employmentType: adminEmpType || null,
          internType:     adminEmpType || null,
        } : {}),
      };
      const res  = await fetch(`${API}/api/auth/profile`, {
        method: "PUT", headers: authHeaders, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (updateUser) updateUser(data);
        toast.success("✅ Profile saved!");
      } else {
        toast.error(data.message || "Failed to save profile");
      }
    } catch (e) {
      toast.error("Server error — check backend is running");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar upload ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res  = await fetch(`${API}/api/auth/upload-avatar`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl);
        if (updateUser) updateUser({ avatarUrl: data.avatarUrl });
        toast.success("Avatar updated!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    if (!currentPwd) return toast.error("Enter your current password");
    if (!newPwd || newPwd.length < 6) return toast.error("New password must be 6+ characters");
    if (newPwd !== confirmPwd) return toast.error("Passwords don't match");
    setChangingPwd(true);
    try {
      const res  = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("🔒 Password changed!");
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        toast.error(data.message || "Failed");
      }
    } catch { toast.error("Server error — check backend is running"); }
    finally { setChangingPwd(false); }
  };

  const avatarLetter = (name || user?.name || "U")[0]?.toUpperCase();
  const avatarSrc    = avatarUrl ? (avatarUrl.startsWith("http") ? avatarUrl : `${API}${avatarUrl}`) : null;

  const ROLE_BADGE = {
    admin:     { bg: "bg-red-900/40 text-red-300 border border-red-700",     icon: "👑" },
    developer: { bg: "bg-purple-900/40 text-purple-300 border border-purple-700", icon: "💻" },
    member:    { bg: "bg-blue-900/40 text-blue-300 border border-blue-700",   icon: "👤" },
    intern:    { bg: "bg-green-900/40 text-green-300 border border-green-700", icon: "🌱" },
  };
  const rb = ROLE_BADGE[role] || ROLE_BADGE.member;

  const TABS = [
    { id: "profile",  label: "Profile",  icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto py-10 px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your profile and account security</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === t.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="space-y-6">

            {/* Avatar + color */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Photo & Avatar</h2>
              <div className="flex items-center gap-6">
                {/* Avatar circle */}
                <div className="relative group cursor-pointer flex-shrink-0"
                  onClick={() => fileRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
                    style={{ background: avatarSrc ? "transparent" : avatarColor }}>
                    {avatarSrc
                      ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover"/>
                      : avatarLetter}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {uploading
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      : <span className="text-white text-xs font-semibold">Change</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
                </div>
                {/* Color picker */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Or pick avatar color</p>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setAvatarColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${avatarColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"}`}
                        style={{ background: c }}/>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">JPG, PNG, GIF — max 5MB. Click avatar to upload.</p>
                </div>
              </div>
            </div>

            {/* Role & Access — editable for admin, read-only for others */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Role & Access</h2>
                {!isAdmin && (
                  <span className="text-[10px] text-amber-400 bg-amber-900/20 border border-amber-700/40 px-2 py-1 rounded-full">
                    🔒 Set by admin
                  </span>
                )}
              </div>

              {/* Role badge — always read-only in Settings (change via Accounts page) */}
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Role</p>
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${rb.bg}`}>
                    <span>{rb.icon}</span>
                    <span className="capitalize">{displayRole}</span>
                  </div>
                  {isAdmin && <span className="text-[10px] text-gray-600">Role changes: use Accounts page for other users</span>}
                </div>
              </div>

              {isAdmin ? (
                /* Admin: editable org fields */
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Level</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Intern","Junior","Mid","Senior","Lead"].map(lv => (
                        <button key={lv} onClick={() => setAdminLevel(lv === adminLevel ? "" : lv)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                            adminLevel === lv
                              ? "bg-purple-600 border-purple-600 text-white"
                              : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                          }`}>{lv}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Employment Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Full-Time","Part-Time","Remote","Contract","Freelance","Internship","Apprenticeship"].map(et => (
                        <button key={et} onClick={() => setAdminEmpType(et === adminEmpType ? "" : et)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                            adminEmpType === et
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                          }`}>{et}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Department</p>
                    <select value={adminDept} onChange={e => setAdminDept(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                      <option value="">Select department...</option>
                      {["Frontend Engineering","Backend Engineering","Full Stack Engineering","Mobile Engineering","DevOps / Cloud","Platform Engineering","QA Engineering","Security Engineering","Product Management","UX Design","UI Design","Design Systems","Data Engineering","Data Science","Machine Learning","AI Research","Analytics","Project Management","Technical Writing","Customer Success","HR Technology","Finance & Operations","R&D","IT Support","Other"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Non-admin: read-only display */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Employment Type</p>
                    {displayEmpType
                      ? <span className="inline-block px-3 py-1.5 bg-gray-800 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700">{displayEmpType}</span>
                      : <span className="text-xs text-gray-600 italic">Not set by admin</span>}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Level</p>
                    {displayLevel
                      ? <span className="inline-block px-3 py-1.5 bg-gray-800 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700">{displayLevel}</span>
                      : <span className="text-xs text-gray-600 italic">Not set by admin</span>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Department</p>
                    {displayDept
                      ? <span className="inline-block px-3 py-1.5 bg-gray-800 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700">{displayDept}</span>
                      : <span className="text-xs text-gray-600 italic">Not set by admin</span>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-600">Role, level, department and employment type are assigned by your admin.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Editable fields — everyone can change these */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Personal Info</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Full Name *
                  </label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Email *
                  </label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Job Title
                </label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Bio (optional)
                </label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  placeholder="Tell your team a bit about yourself..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Skills (comma separated)
                  </label>
                  <input value={skills} onChange={e => setSkills(e.target.value)}
                    placeholder="React, Node.js, Python..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Joined Date
                  </label>
                  <input value={joinedDate} onChange={e => setJoinedDate(e.target.value)} type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
                </div>
              </div>

              {/* Mentor selector */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Mentor / Manager (optional)
                </label>
                <select value={mentorId} onChange={e => setMentorId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">No mentor selected</option>
                  {allUsers.filter(u => u.id !== user?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} {u.jobTitle ? `· ${u.jobTitle}` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button onClick={handleSaveProfile} disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors">
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>
                    : "💾 Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === "security" && (
          <div className="space-y-6">

            {/* Change password */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Change Password</h2>
                <p className="text-gray-400 text-xs mt-0.5">Must know your current password to change it</p>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Current Password</label>
                <input value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                  type={showPwd ? "text" : "password"} placeholder="Enter current password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">New Password</label>
                <div className="relative">
                  <input value={newPwd} onChange={e => setNewPwd(e.target.value)}
                    type={showPwd ? "text" : "password"} placeholder="Min 6 characters"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-16 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
                  <button onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200 font-semibold">
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                <input value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  type={showPwd ? "text" : "password"} placeholder="Repeat new password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
              </div>

              {/* Strength indicator */}
              {newPwd.length > 0 && (
                <div className="flex items-center gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      newPwd.length >= i * 3
                        ? newPwd.length >= 12 ? "bg-green-500" : newPwd.length >= 8 ? "bg-yellow-500" : "bg-red-500"
                        : "bg-gray-700"
                    }`}/>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1">
                    {newPwd.length < 6 ? "Too short" : newPwd.length < 8 ? "Weak" : newPwd.length < 12 ? "Good" : "Strong"}
                  </span>
                </div>
              )}

              <button onClick={handleChangePassword} disabled={changingPwd}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors">
                {changingPwd
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Changing...</>
                  : "🔒 Change Password"}
              </button>
            </div>

            {/* Danger zone */}
            <div className="bg-red-950/20 rounded-2xl p-6 border border-red-900/40">
              <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
              <p className="text-red-400/60 text-xs mt-0.5 mb-4">Permanent — cannot be undone.</p>
              <button
                onClick={() => {
                  if (window.confirm("Log out from all devices?")) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "/login";
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors">
                🚪 Log Out Everywhere
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}