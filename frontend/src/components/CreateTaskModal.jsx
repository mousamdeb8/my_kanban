import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CreateTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tag, setTag] = useState("");

  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);

  // fetch users once
  useEffect(() => {
    fetch("http://localhost:8000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => toast.error("Failed to load users"));
  }, []);

  const handleSubmit = async () => {
    // 🔹 VALIDATION TOASTS
    if (!title.trim()) return toast.error("Please enter Title");
    if (!priority) return toast.error("Please select Priority");
    if (!status) return toast.error("Please select Status");
    if (!dueDate) return toast.error("Please select Due Date");
    if (!userId) return toast.error("Please select Assignee");

    setLoading(true);

    // 🔹 Build payload without null fields
    const payload = {
      title: title.trim(),
      priority,
      status,
      dueDate,
      user_id: Number(userId), // ✅ backend expects snake_case
    };

    if (description.trim()) payload.description = description.trim();
    if (tag.trim()) payload.tag = tag.trim();
    payload.attachments = []; // keep empty array

    try {
      await onCreate(payload); // call Home.jsx handler
    } catch (err) {
      console.error("Modal create task error:", err);
      // no toast here
    }

    // 🔹 RESET FIELDS
    setTitle("");
    setDescription("");
    setPriority("");
    setStatus("");
    setDueDate("");
    setTag("");
    setUserId("");

    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Create Task</h2>

        {/* Title */}
        <input
          type="text"
          placeholder="Title *"
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
            <option value="" disabled>
              Select Priority *
            </option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
          >
            <option value="" disabled>
              Select Status *
            </option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
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

        {/* Assignee Dropdown */}
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded"
        >
          <option value="">Select Assignee *</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex justify-end gap-3">
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
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
