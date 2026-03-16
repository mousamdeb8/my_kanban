import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TASK_TYPES = [
  { value: "task",    label: "Task",    emoji: "✅" },
  { value: "bug",     label: "Bug",     emoji: "🐛" },
  { value: "request", label: "Request", emoji: "💬" },
  { value: "epic",    label: "Epic",    emoji: "⚡" },
];
const PRIORITY_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#3b82f6" };
const STATUS_OPTIONS  = [
  { value: "todo",       label: "To Do"       },
  { value: "inprogress", label: "In Progress" },
  { value: "inreview",   label: "In Review"   },
  { value: "done",       label: "Done"        },
];
const ROLE_BADGE = {
  admin:     "bg-red-100 text-red-700",
  developer: "bg-purple-100 text-purple-700",
  member:    "bg-blue-100 text-blue-700",
  intern:    "bg-green-100 text-green-700",
};

function Avatar({ name, color, size = 6 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}
      style={{ background: color || "#3b82f6" }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function stringToColor(str = "") {
  const c = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

export default function CreateTaskModal({ projectId, token, user, onClose, onCreate }) {
  const [taskType,     setTaskType]     = useState("task");
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [priority,     setPriority]     = useState("Medium");
  const [status,       setStatus]       = useState("todo");
  const [dueDate,      setDueDate]      = useState("");
  const [tag,          setTag]          = useState("");
  const [assignedById, setAssignedById] = useState("");
  const [assignToId,   setAssignToId]   = useState("");
  const [assignerOptions, setAssignerOptions] = useState([]); // Admin + Developer only
  const [assigneeOptions, setAssigneeOptions] = useState([]); // Everyone
  const [loading,      setLoading]      = useState(false);

  const isIntern  = user?.role === "intern";
  const canAssign = user?.role === "admin" || user?.role === "developer";

  // UPDATED: Fetch ALL active users from auth_users table (not project-specific)
  useEffect(() => {
    if (!canAssign) return;
    
    console.log('🔍 Fetching users from:', `${API}/api/users/active`);
    
    // NEW ENDPOINT: /api/users/active returns {assigners, assignees}
    fetch(`${API}/api/users/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        console.log('📡 Response status:', r.status);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then(data => {
        console.log('📦 Received data:', data);
        
        // Backend returns: {assigners: [...], assignees: [...]}
        if (data.assigners && data.assignees) {
          console.log('✅ Valid format - Assigners:', data.assigners.length, 'Assignees:', data.assignees.length);
          setAssignerOptions(data.assigners); // Only admin + developer
          setAssigneeOptions(data.assignees); // Everyone (admin, dev, member, intern)
          
          // Default "Assigned By" to the currently logged-in user
          // Match by ID first (most reliable), then by email as fallback
          const me = data.assigners.find(u => 
            String(u.id) === String(user?.id) || 
            u.email?.toLowerCase() === user?.email?.toLowerCase()
          );
          
          if (me) {
            setAssignedById(String(me.id)); // This is auth_users.id
            console.log('✅ Set Assigned By to:', me.name); // Debug log
          } else {
            console.warn('⚠️ Could not find current user in assigners list');
            console.log('Current user:', user);
            console.log('Assigners:', data.assigners);
          }
        } else {
          console.error('❌ Invalid data format received:', data);
          console.error('Expected: {assigners: [...], assignees: [...]}');
          toast.error("Invalid user data format from server");
        }
      })
      .catch(err => {
        console.error("❌ Failed to fetch active users:", err);
        toast.error("Failed to load users: " + err.message);
      });
  }, [token, canAssign, user?.email, user?.id]);

  const selectedAssigner = assignerOptions.find(u => String(u.id) === String(assignedById));
  const selectedAssignee = assigneeOptions.find(u => String(u.id) === String(assignToId));
  const selectedType = TASK_TYPES.find(t => t.value === taskType);

  const headerTitle = title.trim() || "Create Task";
  const headerSub   = title.trim()
    ? `${selectedType?.emoji} ${selectedType?.label} · ${priority} priority`
    : "Add a new item to the board";

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Title required");
    if (!dueDate)       return toast.error("Due date required");
    
    console.log('📤 Creating task with:');
    console.log('  assignToId:', assignToId, 'type:', typeof assignToId);
    console.log('  canAssign:', canAssign);
    console.log('  Number(assignToId):', Number(assignToId));
    console.log('  assignToUserId will be:', canAssign ? (Number(assignToId) || null) : null);
    
    setLoading(true);
    try {
      const payload = {
        title:       title.trim(),
        description: description.trim() || null,
        priority,
        status,
        dueDate,
        tag:         tag.trim() || null,
        taskType,
        project_id:  Number(projectId),
        // IMPORTANT: Send the auth_users.id as assignToUserId
        // Backend will handle creating the users table record
        assignToUserId: canAssign ? (Number(assignToId) || null) : null,
      };
      
      console.log('📦 Full payload:', payload);
      
      await onCreate(payload);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* ── Header: live title + task type emoji ── */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: PRIORITY_COLORS[priority] + "18", border: `1.5px solid ${PRIORITY_COLORS[priority]}44` }}>
            {selectedType?.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 dark:text-white truncate">{headerTitle}</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{headerSub}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 text-xl flex-shrink-0">
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[65vh]">

          {/* Task Type */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Task Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TASK_TYPES.map(t => (
                <button key={t.value} onClick={() => setTaskType(t.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    taskType === t.value
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100"
                  }`}>
                  <span className="text-xl">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={`${selectedType?.label} title...`} autoFocus
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="What needs to be done?"
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400"/>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Priority</label>
              <div className="flex gap-1">
                {["High","Medium","Low"].map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className="flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all"
                    style={priority === p
                      ? { background: PRIORITY_COLORS[p], color: "#fff", borderColor: PRIORITY_COLORS[p] }
                      : { background: "#f9fafb", color: "#6b7280", borderColor: "#e5e7eb" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date + Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Due Date *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"/>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tag</label>
              <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. bug, feature"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"/>
            </div>
          </div>

          {/* ── Assignment — two clean dropdowns ── */}
          {canAssign && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">

              {/* Row header */}
              <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1">Assigned By</span>
                <span className="text-gray-300 px-4">→</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1 text-right">Assign To</span>
              </div>

              <div className="flex items-center gap-0 bg-white dark:bg-gray-800">

                {/* ── Assigned By dropdown (admins + developers) ── */}
                <div className="flex-1 px-3 py-3 border-r border-gray-100 dark:border-gray-700">
                  <select value={assignedById} onChange={e => setAssignedById(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 mb-2">
                    <option value="">Select assigner...</option>
                    {assignerOptions.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  {/* Preview of selected assigner */}
                  {selectedAssigner ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Avatar name={selectedAssigner.name} color={selectedAssigner.avatarColor || stringToColor(selectedAssigner.name)}/>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800 dark:text-white truncate">{selectedAssigner.name}</p>
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded capitalize ${ROLE_BADGE[(selectedAssigner.role||"").toLowerCase()] || ""}`}>
                          {selectedAssigner.role}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[10px]">?</div>
                      <p className="text-[10px] text-gray-400">Not selected</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="px-2 text-gray-300 text-lg flex-shrink-0">→</div>

                {/* ── Assign To dropdown (all users) ── */}
                <div className="flex-1 px-3 py-3">
                  <select value={assignToId} onChange={e => setAssignToId(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 mb-2">
                    <option value="">Unassigned</option>
                    {assigneeOptions.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  {/* Preview of selected assignee */}
                  {selectedAssignee ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Avatar name={selectedAssignee.name} color={selectedAssignee.avatarColor || stringToColor(selectedAssignee.name)}/>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800 dark:text-white truncate">{selectedAssignee.name}</p>
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded capitalize ${ROLE_BADGE[(selectedAssignee.role||"").toLowerCase()] || ""}`}>
                          {selectedAssignee.role}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[10px]">?</div>
                      <p className="text-[10px] text-gray-400">Unassigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification hint */}
              {selectedAssignee && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-800">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    🔔 {selectedAssignee.name} will be notified about this assignment
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Intern info */}
          {isIntern && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-300 font-medium">
                🌱 This task will be visible to your team. Only you can edit it.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{selectedType?.emoji}</span>
            <span className="text-xs font-semibold text-gray-500 capitalize">{selectedType?.label}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: PRIORITY_COLORS[priority] }}>{priority}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-700">Cancel</button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow disabled:opacity-50 flex items-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</>
                : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}