import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import toast, { Toaster } from "react-hot-toast";

const ROLES = ["admin", "developer", "member"];
const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#06b6d4","#f97316"];

export default function Settings() {
  const { dark, toggle } = useTheme();

  // Profile
  const [profile, setProfile] = useState(() => {
    const s = localStorage.getItem("profile");
    return s ? JSON.parse(s) : { name: "Mousam Deb", email: "mousam@example.com", role: "admin", avatarColor: "#3b82f6" };
  });
  const [editProfile, setEditProfile] = useState({ ...profile });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState(() => {
    const s = localStorage.getItem("notifPrefs");
    return s ? JSON.parse(s) : {
      taskAssigned:  true,
      taskOverdue:   true,
      dailyDigest:   false,
      browserNotifs: false,
    };
  });

  const saveProfile = async () => {
    if (!editProfile.name.trim())  return toast.error("Name is required");
    if (!/\S+@\S+\.\S+/.test(editProfile.email)) return toast.error("Valid email required");
    setSavingProfile(true);
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem("profile", JSON.stringify(editProfile));
    setProfile(editProfile);
    setSavingProfile(false);
    toast.success("Profile updated!");
  };

  const savePassword = async () => {
    if (!passwords.current)            return toast.error("Enter current password");
    if (passwords.newPass.length < 6)  return toast.error("New password must be 6+ characters");
    if (passwords.newPass !== passwords.confirm) return toast.error("Passwords don't match");
    setSavingPw(true);
    await new Promise(r => setTimeout(r, 800));
    setSavingPw(false);
    setPasswords({ current: "", newPass: "", confirm: "" });
    toast.success("Password changed!");
  };

  const saveNotifs = () => {
    localStorage.setItem("notifPrefs", JSON.stringify(notifs));
    toast.success("Notification preferences saved!");
  };

  const Section = ({ title, description, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );

  const Toggle = ({ checked, onChange, label, sub }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`}/>
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-900 min-h-full">
      <Toaster position="top-right"/>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile, security and preferences</p>
      </div>

      {/* ── Profile ── */}
      <Section title="Profile" description="Update your personal information">
        {/* Avatar picker */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg"
            style={{ background: editProfile.avatarColor }}>
            {editProfile.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Avatar color</p>
            <div className="flex gap-2">
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => setEditProfile(p => ({ ...p, avatarColor: c }))}
                  className={`w-6 h-6 rounded-full transition-all ${editProfile.avatarColor === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                  style={{ background: c }}/>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
            <input type="text" value={editProfile.name}
              onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
            <input type="email" value={editProfile.email}
              onChange={e => setEditProfile(p => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Role</label>
          <div className="flex gap-2">
            {ROLES.map(r => (
              <button key={r} onClick={() => setEditProfile(p => ({ ...p, role: r }))}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                  editProfile.role === r ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                }`}>{r}
              </button>
            ))}
          </div>
        </div>

        <button onClick={saveProfile} disabled={savingProfile}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-all disabled:opacity-50 flex items-center gap-2">
          {savingProfile ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : "Save Profile"}
        </button>
      </Section>

      {/* ── Appearance ── */}
      <Section title="Appearance" description="Customize how Kanban looks">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${dark ? "bg-gray-700" : "bg-yellow-50"}`}>
              {dark ? "🌙" : "☀️"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{dark ? "Dark Mode" : "Light Mode"}</p>
              <p className="text-xs text-gray-400">{dark ? "Easy on the eyes at night" : "Clean and bright interface"}</p>
            </div>
          </div>
          <button onClick={toggle}
            className={`relative w-14 h-7 rounded-full transition-colors ${dark ? "bg-blue-600" : "bg-gray-200"}`}>
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-7" : ""}`}/>
          </button>
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Email Notifications" description="Choose when to receive email alerts via Gmail SMTP">
        <div className="mb-4 flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <span className="text-lg">📧</span>
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Gmail SMTP Connected</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Emails sent via <strong>{profile.email}</strong></p>
          </div>
        </div>

        <Toggle checked={notifs.taskAssigned} onChange={v => setNotifs(n => ({ ...n, taskAssigned: v }))}
          label="Task Assigned" sub="Get an email when a task is assigned to someone"/>
        <Toggle checked={notifs.taskOverdue} onChange={v => setNotifs(n => ({ ...n, taskOverdue: v }))}
          label="Task Overdue" sub="Get notified when a task passes its due date"/>
        <Toggle checked={notifs.dailyDigest} onChange={v => setNotifs(n => ({ ...n, dailyDigest: v }))}
          label="Daily Digest" sub="Receive a daily summary of project activity"/>
        <Toggle checked={notifs.browserNotifs} onChange={v => setNotifs(n => ({ ...n, browserNotifs: v }))}
          label="Browser Notifications" sub="Show desktop notifications in your browser"/>

        <button onClick={saveNotifs} className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-all">
          Save Preferences
        </button>
      </Section>

      {/* ── Password ── */}
      <Section title="Change Password" description="Keep your account secure">
        <div className="space-y-3 mb-5">
          {[
            { key: "current", label: "Current Password",  placeholder: "Enter current password" },
            { key: "newPass", label: "New Password",      placeholder: "Min 6 characters" },
            { key: "confirm", label: "Confirm Password",  placeholder: "Repeat new password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder={placeholder}
                  value={passwords[key]}
                  onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 pr-10"/>
                {key === "newPass" && (
                  <button onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showPw ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              {key === "newPass" && passwords.newPass && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                      passwords.newPass.length > i * 2
                        ? passwords.newPass.length < 6 ? "bg-red-400" : passwords.newPass.length < 10 ? "bg-yellow-400" : "bg-green-400"
                        : "bg-gray-200"
                    }`}/>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1">
                    {passwords.newPass.length < 6 ? "Weak" : passwords.newPass.length < 10 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={savePassword} disabled={savingPw}
          className="px-5 py-2.5 bg-gray-800 dark:bg-gray-600 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg shadow transition-all disabled:opacity-50 flex items-center gap-2">
          {savingPw ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Changing...</> : "🔒 Change Password"}
        </button>
      </Section>

      {/* ── Danger zone ── */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 px-6 py-5">
        <h2 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-red-500 mb-4">These actions are permanent and cannot be undone.</p>
        <button onClick={() => { localStorage.clear(); toast.success("Logged out!"); window.location.href = "/projects"; }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}