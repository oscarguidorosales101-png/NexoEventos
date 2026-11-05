import api from './api.js';

export const authService = {
  async login(correo, password) {
    const res = await api.post('/auth/login', { correo, password });
    return res.data;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    return res.data;
  }
};

