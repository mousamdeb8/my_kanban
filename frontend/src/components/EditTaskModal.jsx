import { useState, useEffect } from "react";

export default function EditTaskModal({ task, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "Low");
  const [status, setStatus] = useState(task.status || "todo");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [tag, setTag] = useState(task.tag || "");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(task.title || "");
    setDescription(task.description || "");
    setPriority(task.priority || "Low");
    setStatus(task.status || "todo");
    setDueDate(task.dueDate || "");
    setTag(task.tag || "");
    setAssignee(task.assignee || "");
  }, [task]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onUpdate({
        ...task,
        title,
        description,
        priority,
        status,
        dueDate: dueDate || null,
        tag: tag || null,
        assignee: assignee || null,
      });
      onClose(); // closes modal but task remains on board
    } catch (err) { console.error("Update failed", err); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(task.id);
    } catch (err) { console.error("Delete failed", err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Edit Task</h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300"
          rows={3}
        />

        <div className="flex gap-3 mb-3">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex-1 border px-3 py-2 rounded focus:ring focus:ring-blue-300"
          >
            {["High", "Medium", "Low"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 border px-3 py-2 rounded focus:ring focus:ring-blue-300"
          >
            {[
              { value: "todo", label: "To Do" },
              { value: "inprogress", label: "In Progress" },
              { value: "done", label: "Done" },
            ].map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300"
        />

        <input
          type="text"
          placeholder="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full border px-3 py-2 mb-3 rounded focus:ring focus:ring-blue-300"
        />

        <input
          type="text"
          placeholder="Assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded focus:ring focus:ring-blue-300"
        />

        <div className="flex justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
