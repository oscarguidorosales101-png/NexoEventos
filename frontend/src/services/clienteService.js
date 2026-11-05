import api from './api.js';

export const clienteService = {
  async getAll() {
    const res = await api.get('/clientes');
    return res.data || [];
  },

  async getById(id) {
    const res = await api.get(`/clientes/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/clientes', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/clientes/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/clientes/${id}`);
    return res;
  }
};

