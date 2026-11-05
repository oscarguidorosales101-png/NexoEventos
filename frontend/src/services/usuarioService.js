import api from './api.js';

export const usuarioService = {
  async getAll() {
    const res = await api.get('/usuarios');
    return res.data || [];
  },

  async getById(id) {
    const res = await api.get(`/usuarios/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/usuarios', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/usuarios/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/usuarios/${id}`);
    return res;
  }
};

