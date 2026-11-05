import api from './api.js';

export const rolService = {
  async getAll() {
    const res = await api.get('/roles');
    return res.data || [];
  },

  async getById(id) {
    const res = await api.get(`/roles/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/roles', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/roles/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/roles/${id}`);
    return res;
  }
};

