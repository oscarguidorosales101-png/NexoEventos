import api from './api.js';

export const servicioService = {
  async getAll() {
    const res = await api.get('/servicios');
    return res.data || [];
  },

  async getById(id) {
    const res = await api.get(`/servicios/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/servicios', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/servicios/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/servicios/${id}`);
    return res;
  }
};

