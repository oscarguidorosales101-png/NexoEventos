import React from 'react';
import { CalendarDays, Download, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export const CalendarHeader = ({
  viewMode,
  setViewMode,
  currentDate,
  onPrev,
  onNext,
  onToday,
  dateRangeLabel,
  searchTerm,
  setSearchTerm,
  onNewSchedule,
  onExportICS,
  canManage = false,
  connected = true
}) => {
  return (
    <div className="calendar-topbar">
      <div className="calendar-title-box">
        <h1>
          <CalendarDays size={24} style={{ color: 'var(--gold-primary)' }} />
          <span>Agenda & Calendario</span>
          <span
            className="live-pulse"
            title={connected ? 'Sincronización en tiempo real activa' : 'Desconectado'}
            style={{ backgroundColor: connected ? 'var(--accent-success)' : 'var(--accent-danger)' }}
          />
        </h1>
        <p>
          {connected ? 'Sincronizado en tiempo real' : 'Reconectando...'} | Zona horaria: America/Costa_Rica (UTC-6)
        </p>
      </div>

      <div className="calendar-actions-cluster">
        {/* Barra de Búsqueda */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar actividad o lugar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '230px', padding: '0.4rem 0.75rem 0.4rem 2rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Selector de Vista: Semana | Mes | Día */}
        <div className="calendar-view-toggle">
          <button
            type="button"
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mes
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Día
          </button>
        </div>

        {/* Controles de Navegación Temporal */}
        <div className="calendar-nav-controls">
          <button
            type="button"
            className="nav-arrow-btn"
            onClick={onPrev}
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onToday}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            Hoy
          </button>
          <button
            type="button"
            className="nav-arrow-btn"
            onClick={onNext}
            title="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <span className="current-range-label">{dateRangeLabel}</span>
        </div>

        {/* Botones de Acción */}
        <button
          type="button"
          className="btn btn-outline-gold btn-sm"
          onClick={onExportICS}
          title="Exportar archivo de calendario RFC 5545 iCalendar"
        >
          <Download size={14} />
          <span>Exportar .ICS</span>
        </button>

        {canManage && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNewSchedule}
          >
            <Plus size={14} />
            <span>Nueva Agenda</span>
          </button>
        )}
      </div>
    </div>
  );
};
