import axios from "axios";

const API = "http://localhost:8000/api/tasks"; // ✅ correct backend URL

// Get all tasks
export const fetchTasks = async () => {
  const res = await axios.get(API);
  return res.data;
};

// Create task
export const createTask = async (task) => {
  const res = await axios.post(API, task);
  return res.data;
};

// Update full task (from edit modal)
export const updateTask = async (id, updatedTask) => {
  const res = await axios.put(`${API}/${id}`, updatedTask);
  return res.data;
};

// Update only status (drag & drop)
export const updateTaskStatus = async (id, status) => {
  const res = await axios.patch(`${API}/${id}/status`, { status });
  return res.data;
};

// Delete task
export const deleteTask = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};
