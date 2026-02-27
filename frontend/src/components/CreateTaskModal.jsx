import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const priorityConfig = {
  High:   { icon: "▲", color: "text-red-500",    bg: "bg-red-50 border-red-200" },
  Medium: { icon: "●", color: "text-yellow-500",  bg: "bg-yellow-50 border-yellow-200" },
  Low:    { icon: "▼", color: "text-blue-400",    bg: "bg-blue-50 border-blue-200" },
};

const statusConfig = {
  todo:       { label: "To Do",       color: "bg-blue-100 text-blue-700" },
  inprogress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  inreview:   { label: "In Review",   color: "bg-purple-100 text-purple-700" },
  done:       { label: "Done",        color: "bg-green-100 text-green-700" },
};

export default function CreateTaskModal({ onClose, onCreate }) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]     = useState("");
  const [status, setStatus]         = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [tag, setTag]               = useState("");
  const [userId, setUserId]         = useState("");
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/users")
      .then(r => r.json())
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!priority)     return toast.error("Select a priority");
    if (!status)       return toast.error("Select a status");
    if (!dueDate)      return toast.error("Select a due date");
    if (!userId)       return toast.error("Select an assignee");

    setLoading(true);
    const payload = {
      title: title.trim(),
      priority, status, dueDate,
      user_id: Number(userId),
      attachments: [],
      ...(description.trim() && { description: description.trim() }),
      ...(tag.trim() && { tag: tag.trim() }),
    };

    try {
      await onCreate(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => String(u.id) === String(userId));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-0.5">My Kanban Project</p>
            <h2 className="text-lg font-bold text-gray-800">Create Issue</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Issue summary *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-lg font-semibold text-gray-800 placeholder-gray-300 border-0 border-b-2 border-gray-100 focus:border-blue-500 focus:outline-none pb-2 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              placeholder="Add a description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none transition-all"
              rows={3}
            />
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Priority</label>
              <div className="flex flex-col gap-1.5">
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setPriority(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      priority === key
                        ? `${cfg.bg} border-current ${cfg.color} shadow-sm`
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`text-xs ${priority === key ? cfg.color : "text-gray-400"}`}>{cfg.icon}</span>
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
              <div className="flex flex-col gap-1.5">
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStatus(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      status === key
                        ? `${cfg.color} border-current shadow-sm`
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date + Tag row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Label / Tag</label>
              <input
                type="text"
                placeholder="e.g. frontend, bug"
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Assignee</label>
            <div className="flex flex-wrap gap-2">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setUserId(user.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    String(userId) === String(user.id)
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: stringToColor(user.name) }}
                  >
                    {user.name[0].toUpperCase()}
                  </div>
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
            ) : "Create Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function stringToColor(str) {
  const colors = ["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}