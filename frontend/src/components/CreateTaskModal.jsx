import { useState } from "react";

export default function CreateTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [tag, setTag] = useState("");
  const [assignee, setAssignee] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const priorityOptions = ["High", "Medium", "Low"];
  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "inprogress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

 const handleSubmit = async () => {
  if (!title.trim()) return;
  setLoading(true);

  try {
    await onCreate({
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
      tag: tag.trim() || null,   // ✅ FIXED
      assignee: assignee.trim() || null,
      attachments: [],
    });

    // Reset fields
    setTitle("");
    setDescription("");
    setPriority("Low");
    setStatus("todo");
    setDueDate("");
    setTag("");
    setAssignee("");
    setAttachments([]);

    onClose();
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Create Task</h2>

        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300" />

        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300" rows={3} />

        <div className="flex gap-3 mb-3">
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="flex-1 border px-3 py-2 rounded focus:ring focus:ring-blue-300">
            {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select value={status} onChange={e => setStatus(e.target.value)}
            className="flex-1 border px-3 py-2 rounded focus:ring focus:ring-blue-300">
            {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300" />

        <input type="text" placeholder="Tag" value={tag} onChange={e => setTag(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300" />

        <input type="text" placeholder="Assignee" value={assignee} onChange={e => setAssignee(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300" />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50">Cancel</button>

          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
