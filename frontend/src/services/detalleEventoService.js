import api from './api.js';

export const detalleEventoService = {
  async getAll(id_evento = null) {
    const query = id_evento ? `?id_evento=${id_evento}` : '';
    const res = await api.get(`/detalle-eventos${query}`);
    return res.data || [];
  },

  async getById(id) {
    const res = await api.get(`/detalle-eventos/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/detalle-eventos', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/detalle-eventos/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/detalle-eventos/${id}`);
    return res;
  }
};

