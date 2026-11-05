import api from './api.js';

export const scheduleService = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/schedules${query ? `?${query}` : ''}`);
    return res.data || [];
  },

  async getSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/schedules/summary${query ? `?${query}` : ''}`);
    return res.data || { all: 0, event: 0, meeting: 0, setupAndRehearsal: 0, taskDeadlines: 0 };
  },

  async getWeek(date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await api.get(`/schedules/week${query}`);
    return res.data;
  },

  async getDay(date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await api.get(`/schedules/day${query}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/schedules/categories');
    return res.data || [];
  },

  async getStaffCandidates() {
    const res = await api.get('/schedules/team-candidates');
    return res.data || [];
  },

  async getTeamCandidates() {
    return this.getStaffCandidates();
  },

  async getById(id) {
    const res = await api.get(`/schedules/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/schedules', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.patch(`/schedules/${id}`, data);
    return res.data;
  },

  async reschedule(id, fecha_inicio, fecha_fin) {
    const res = await api.patch(`/schedules/${id}/reschedule`, { fecha_inicio, fecha_fin });
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/schedules/${id}`);
    return res;
  },

  async getNotes(id) {
    const res = await api.get(`/schedules/${id}/notes`);
    return res.data || [];
  },

  async addNote(id, texto) {
    const res = await api.post(`/schedules/${id}/notes`, { texto, descripcion: texto });
    return res.data;
  },

  async toggleNote(idNota, completada) {
    const res = await api.patch(`/schedules/notes/${idNota}`, { completada });
    return res.data;
  },

  async createNote(id, data) {
    const res = await api.post(`/schedules/${id}/notes`, data);
    return res.data;
  },

  async updateNote(idNota, data) {
    const res = await api.patch(`/schedules/notes/${idNota}`, data);
    return res.data;
  },

  async deleteNote(idNota) {
    const res = await api.delete(`/schedules/notes/${idNota}`);
    return res;
  },

  async addTeamMember(id, id_usuario) {
    const res = await api.post(`/schedules/${id}/team`, { id_usuario });
    return res.data;
  },

  async removeTeamMember(id, userId) {
    const res = await api.delete(`/schedules/${id}/team/${userId}`);
    return res.data;
  },

  async exportICS(params = {}) {
    if (params && params.id_agenda) {
      return this.downloadSingleICS(params.id_agenda);
    }
    return this.downloadICS(params);
  },

  exportICSUrl(params = {}) {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('nexoeventos_token');
    return `/api/schedules/export/ics?${query}`;
  },

  async downloadICS(params = {}) {
    const token = localStorage.getItem('nexoeventos_token');
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/schedules/export/ics?${query}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('Error al descargar archivo de calendario');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexoeventos-agenda.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadSingleICS(id) {
    const token = localStorage.getItem('nexoeventos_token');
    const res = await fetch(`/api/schedules/${id}/export/ics`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('Error al descargar evento');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda-${id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

