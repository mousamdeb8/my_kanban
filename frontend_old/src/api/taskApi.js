import axios from "axios";

const API_URL = "http://localhost:8000/tasks";

//Get all tasks
export const getAllTasks = async () => {
    return axios.get(API_URL);
};

//Create a Task
export const createTask = async (taskData) => {
    return axios.post(API_URL, taskData);
};

//Update Task
export const updateTask = async (id, updatedData) => {
    return axios.put(`${API_URL}/${id}`, updatedData);
};

//Delete a Task
export const deleteTask = async (id) => {
    return axios.delete(`${API_URL}/${id}`);
};

