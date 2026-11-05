import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { scheduleService } from '../services/scheduleService.js';
import { getSocket, subscribeToScheduleEvents } from '../services/socket.js';
import { CalendarHeader } from '../components/calendar/CalendarHeader.jsx';
import { SummaryCards } from '../components/calendar/SummaryCards.jsx';
import { WeeklyView } from '../components/calendar/WeeklyView.jsx';
import { MonthlyView } from '../components/calendar/MonthlyView.jsx';
import { DailyView } from '../components/calendar/DailyView.jsx';
import { ScheduleDetailDrawer } from '../components/calendar/ScheduleDetailDrawer.jsx';
import { ScheduleFormModal } from '../components/calendar/ScheduleFormModal.jsx';
import '../styles/calendar.css';

export const CalendarioPage = () => {
  const { user, isAdmin, isSupervisor, isClient } = useAuth();
  const canManage = isAdmin || isSupervisor;

  // Fecha de referencia actual
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'day'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [summary, setSummary] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Drawer y Modales
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);

  // Helper: cálculo del Lunes de la semana actual
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  // Generar array de 7 días (Lunes a Domingo) para la vista semanal
  const getWeekDays = useCallback(() => {
    const monday = getMonday(currentDate);
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const todayStr = new Date().toISOString().substring(0, 10);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        date: d,
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr
      };
    });
  }, [currentDate]);

  // Carga de categorías y resumen
  const loadCategories = async () => {
    try {
      const cats = await scheduleService.getCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error('Error al cargar categorías de agenda:', err);
    }
  };

  const loadSummary = useCallback(async () => {
    try {
      const data = await scheduleService.getSummary();
      setSummary(data || {});
    } catch (err) {
      console.error('Error al cargar métricas de agenda:', err);
    }
  }, []);

  // Carga de agendas según la vista actual
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      let startStr = '';
      let endStr = '';

      if (viewMode === 'week') {
        const weekDays = getWeekDays();
        startStr = `${weekDays[0].dateStr} 00:00:00`;
        endStr = `${weekDays[6].dateStr} 23:59:59`;
      } else if (viewMode === 'month') {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const first = new Date(y, m - 1, 20); // margen para días previos
        const last = new Date(y, m + 2, 10); // margen para días posteriores
        startStr = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(first.getDate()).padStart(2, '0')} 00:00:00`;
        endStr = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')} 23:59:59`;
      } else {
        // Vista Diaria
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        startStr = `${y}-${m}-${d} 00:00:00`;
        endStr = `${y}-${m}-${d} 23:59:59`;
      }

      const params = {
        fecha_desde: startStr,
        fecha_hasta: endStr
      };

      if (selectedCategory) {
        params.id_categoria = selectedCategory;
      }

      const data = await scheduleService.getAll(params);
      setSchedules(data || []);
    } catch (err) {
      console.error('Error al cargar agendas:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, selectedCategory, getWeekDays]);

  // Efecto inicial y carga de datos
  useEffect(() => {
    loadCategories();
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Suscripción a eventos en tiempo real mediante Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      setSocketConnected(socket.connected);

      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      const unsubscribe = subscribeToScheduleEvents({
        onCreated: (data) => {
          window.showToast?.(`Nueva agenda programada: "${data.titulo}"`, 'info');
          loadSchedules();
          loadSummary();
        },
        onUpdated: (data) => {
          window.showToast?.(`Agenda actualizada: "${data.titulo}"`, 'info');
          loadSchedules();
          loadSummary();
        },
        onRescheduled: (data) => {
          window.showToast?.(`Agenda reagendada: "${data.titulo}"`, 'info');
          loadSchedules();
          loadSummary();
        },
        onDeleted: (data) => {
          window.showToast?.(`Actividad eliminada de la agenda (#${data.id_agenda})`, 'warning');
          loadSchedules();
          loadSummary();
          if (selectedSchedule?.id_agenda === data.id_agenda) {
            setIsDrawerOpen(false);
          }
        },
        onNoteCreated: () => loadSchedules(),
        onNoteUpdated: () => loadSchedules(),
        onNoteDeleted: () => loadSchedules(),
        onMemberAdded: () => loadSchedules(),
        onMemberRemoved: () => loadSchedules(),
        onClientAlert: (data) => {
          window.showToast?.(`Notificación de su evento: ${data.mensaje}`, 'info');
          loadSchedules();
        }
      });

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        unsubscribe();
      };
    }
  }, [loadSchedules, loadSummary, selectedSchedule]);

  // Controles de Navegación Temporal
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Etiqueta del rango de fechas visible
  const getDateRangeLabel = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (viewMode === 'week') {
      const weekDays = getWeekDays();
      const start = weekDays[0].date;
      const end = weekDays[6].date;
      return `${start.getDate()} ${months[start.getMonth()].substring(0, 3)} — ${end.getDate()} ${months[end.getMonth()].substring(0, 3)}, ${end.getFullYear()}`;
    } else if (viewMode === 'month') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return `${currentDate.getDate()} de ${months[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
    }
  };

  // Reagendamiento mediante Drag & Drop
  const handleReschedule = async (id, newStart, newEnd) => {
    try {
      await scheduleService.reschedule(id, newStart, newEnd);
      window.showToast?.('Actividad reagendada exitosamente.', 'success');
      await loadSchedules();
      await loadSummary();
    } catch (err) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        window.showToast?.(`Conflicto de horario: ${err.message}`, 'error');
      } else {
        window.showToast?.(err.message || 'Error al reagendar actividad.', 'error');
      }
    }
  };

  // Guardar (Crear / Editar)
  const handleSaveSchedule = async (payload, id) => {
    if (id) {
      await scheduleService.update(id, payload);
      window.showToast?.('Agenda actualizada exitosamente.', 'success');
    } else {
      await scheduleService.create(payload);
      window.showToast?.('Nueva actividad programada con éxito.', 'success');
    }
    await loadSchedules();
    await loadSummary();
  };

  // Eliminar
  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('¿Confirma que desea eliminar esta actividad de la agenda?')) return;
    try {
      await scheduleService.delete(id);
      window.showToast?.('Actividad eliminada de la agenda.', 'success');
      setIsDrawerOpen(false);
      await loadSchedules();
      await loadSummary();
    } catch (err) {
      window.showToast?.(err.message || 'Error al eliminar actividad.', 'error');
    }
  };

  // Exportar .ICS
  const handleExportICS = async () => {
    try {
      const params = {};
      if (selectedCategory) params.id_categoria = selectedCategory;
      await scheduleService.exportICS(params);
      window.showToast?.('Archivo iCalendar (.ics) descargado con éxito.', 'success');
    } catch (err) {
      window.showToast?.(err.message || 'Error al exportar archivo .ics.', 'error');
    }
  };

  // Filtrado en memoria por término de búsqueda
  const filteredSchedules = schedules.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = s.titulo?.toLowerCase().includes(term);
    const locMatch = s.ubicacion?.toLowerCase().includes(term);
    const picMatch = s.responsable_nombre?.toLowerCase().includes(term);
    return titleMatch || locMatch || picMatch;
  });

  return (
    <div className="calendar-page-container">
      {/* Barra de Encabezado Superior */}
      <CalendarHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        dateRangeLabel={getDateRangeLabel()}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onNewSchedule={() => {
          setScheduleToEdit(null);
          setIsModalOpen(true);
        }}
        onExportICS={handleExportICS}
        canManage={canManage}
        connected={socketConnected}
      />

      {/* Tarjetas de Resumen y Filtro de Categorías */}
      <SummaryCards
        summary={summary}
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId === selectedCategory ? null : catId)}
      />

      {/* Indicador de Carga */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem' }}>
          <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--gold-primary)' }}>Sincronizando actividades...</span>
        </div>
      )}

      {/* Vistas del Calendario */}
      {viewMode === 'week' && (
        <WeeklyView
          days={getWeekDays()}
          schedules={filteredSchedules}
          onSelectSchedule={(s) => {
            setSelectedSchedule(s);
            setIsDrawerOpen(true);
          }}
          onReschedule={handleReschedule}
          canManage={canManage}
        />
      )}

      {viewMode === 'month' && (
        <MonthlyView
          currentDate={currentDate}
          schedules={filteredSchedules}
          onSelectSchedule={(s) => {
            setSelectedSchedule(s);
            setIsDrawerOpen(true);
          }}
          onDayClick={(dateStr) => {
            setCurrentDate(new Date(`${dateStr}T12:00:00`));
            setViewMode('day');
          }}
        />
      )}

      {viewMode === 'day' && (
        <DailyView
          currentDate={currentDate}
          schedules={filteredSchedules}
          onSelectSchedule={(s) => {
            setSelectedSchedule(s);
            setIsDrawerOpen(true);
          }}
        />
      )}

      {/* Drawer Lateral de Detalle */}
      <ScheduleDetailDrawer
        schedule={selectedSchedule}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(s) => {
          setIsDrawerOpen(false);
          setScheduleToEdit(s);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteSchedule}
        canManage={canManage}
        isClient={isClient}
      />

      {/* Modal de Creación / Edición */}
      <ScheduleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setScheduleToEdit(null);
        }}
        onSave={handleSaveSchedule}
        scheduleToEdit={scheduleToEdit}
        categories={categories}
      />
    </div>
  );
};

