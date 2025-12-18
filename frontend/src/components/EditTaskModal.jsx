import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function EditTaskModal({ task, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "Low");
  const [status, setStatus] = useState(task.status || "todo");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [tag, setTag] = useState(task.tag || "");
  const [attachments, setAttachments] = useState(task.attachments || []);

  // 🔽 NEW: users list and selected user ID
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(task.user?.id || "");

  const [loading, setLoading] = useState(false);

  const priorityOptions = ["High", "Medium", "Low"];
  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "inprogress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  // 🔽 Fetch users for dropdown
  useEffect(() => {
    fetch("http://localhost:8000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => toast.error("Failed to load users"));
  }, []);

  useEffect(() => {
    setTitle(task.title || "");
    setDescription(task.description || "");
    setPriority(task.priority || "Low");
    setStatus(task.status || "todo");
    setDueDate(task.dueDate || "");
    setTag(task.tag || "");
    setAttachments(task.attachments || []);
    setUserId(task.user?.id || ""); // pre-select assigned user
  }, [task]);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Please enter Title");
    if (!priority) return toast.error("Please select Priority");
    if (!status) return toast.error("Please select Status");
    if (!dueDate) return toast.error("Please select Due Date");
    if (!userId) return toast.error("Please select Assignee");

    setLoading(true);
    try {
      await onUpdate({
        ...task,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        dueDate,
        tag: tag.trim() || null,
        attachments,
        user_id: Number(userId), // 🔽 send user_id to backend
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Edit Task</h2>

        {/* Title */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded"
        />

        {/* Description */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded"
          rows={3}
        />

        {/* Priority & Status */}
        <div className="flex gap-3 mb-3">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded"
        />

        {/* Tag */}
        <input
          type="text"
          placeholder="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded"
        />

        {/* 🔽 Assignee Dropdown */}
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded"
        >
          <option value="">Select Assignee *</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex justify-between gap-3 mt-4">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
