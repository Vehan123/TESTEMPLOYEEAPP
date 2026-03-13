import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_BASE });

export const getEmployees = (department) => {
  const params = department ? { department } : {};
  return api.get('/employees', { params }).then((r) => r.data);
};

export const getEmployee = (id) => api.get(`/employees/${id}`).then((r) => r.data);

export const createEmployee = (data) => api.post('/employees', data).then((r) => r.data);

export const updateEmployee = (id, data) =>
  api.put(`/employees/${id}`, data).then((r) => r.data);

export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
