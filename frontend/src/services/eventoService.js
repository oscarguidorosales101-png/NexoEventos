import api from './api.js';

export const eventoService = {
  async getAll() {
    const res = await api.get('/eventos');
    return res.data || [];
  },

  async getById(id) {
    const res = await api.get(`/eventos/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/eventos', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/eventos/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/eventos/${id}`);
    return res;
  }
};

