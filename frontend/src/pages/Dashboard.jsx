import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { eventoService } from '../services/eventoService.js';
import { clienteService } from '../services/clienteService.js';
import { servicioService } from '../services/servicioService.js';
import { usuarioService } from '../services/usuarioService.js';
import { scheduleService } from '../services/scheduleService.js';
import {
  Calendar,
  CalendarDays,
  Users,
  Briefcase,
  UserCheck,
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Activity,
  MapPin,
  Check,
  User,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';

export const Dashboard = () => {
  const { user, isAdmin, isSupervisor, isClient } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Datos globales y operativos
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [scheduleSummary, setScheduleSummary] = useState({ all: 0, event: 0, meeting: 0, setupAndRehearsal: 0, taskDeadlines: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Cargar eventos (filtrados por backend según rol)
      const eventosData = await eventoService.getAll();
      setEventos(eventosData);

      // 2. Cargar servicios (público / común)
      const serviciosData = await servicioService.getAll().catch(() => []);
      setServicios(serviciosData);

      // 3. Cargar datos específicos respetando estrictamente RBAC
      if (isAdmin) {
        // Solo el administrador consulta clientes, usuarios del sistema y agenda completa
        const [clientesData, usuariosData, summaryData, schedulesData] = await Promise.all([
          clienteService.getAll().catch(() => []),
          usuarioService.getAll().catch(() => []),
          scheduleService.getSummary().catch(() => ({ all: 0 })),
          scheduleService.getAll().catch(() => [])
        ]);
        setClientes(clientesData);
        setUsuarios(usuariosData);
        setScheduleSummary(summaryData);
        setSchedules(schedulesData);
      } else if (isSupervisor) {
        // El supervisor consulta clientes y agendas, pero NUNCA llama a usuarioService (evita 403)
        const [clientesData, summaryData, schedulesData] = await Promise.all([
          clienteService.getAll().catch(() => []),
          scheduleService.getSummary().catch(() => ({ all: 0 })),
          scheduleService.getAll().catch(() => [])
        ]);
        setClientes(clientesData);
        setScheduleSummary(summaryData);
        setSchedules(schedulesData);
      } else {
        // Cliente consulta solo sus propios eventos y servicios
        const schedulesData = await scheduleService.getAll().catch(() => []);
        setSchedules(schedulesData);
      }
    } catch (err) {
      setError(err.message || 'Error al sincronizar datos del panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, isSupervisor, isClient]);

  // Acción rápida del Supervisor: Aprobar evento comercial pendiente
  const handleApproveEvent = async (idEvento) => {
    try {
      setError(null);
      await eventoService.update(idEvento, { estado: 'confirmado' });
      setSuccess(`Evento comercial #${idEvento} aprobado y confirmado exitosamente.`);
      setTimeout(() => setSuccess(null), 4000);
      await loadData();
    } catch (err) {
      setError(err.data?.message || err.message || 'No fue posible aprobar el evento.');
      setTimeout(() => setError(null), 4000);
    }
  };

  // Cálculo de estadísticas
  const eventosPendientes = eventos.filter((e) => e.estado === 'pendiente');
  const eventosConfirmados = eventos.filter((e) => e.estado === 'confirmado' || e.estado === 'completado');

  return (
    <div>
      {/* Notificaciones y Avisos */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Banner Principal de Bienvenida */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 23, 33, 1) 100%)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--gold-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isAdmin && 'Panel de Control General · Administrador'}
            {isSupervisor && 'Centro de Operaciones y Logística · Supervisor'}
            {isClient && 'Portal de Experiencia y Seguimiento · Cliente'}
          </span>
          <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
            Bienvenido, <span style={{ color: 'var(--gold-primary)' }}>{user?.nombre}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isAdmin && 'Monitoreo global de la plataforma, control de usuarios, auditoría de eventos y estado del sistema.'}
            {isSupervisor && 'Coordinación operativa, validación de solicitudes comerciales, asignación de responsables y agendas.'}
            {isClient && 'Consulta el estado de tu evento, conoce el cronograma planificado y solicita nuevos servicios exclusivos.'}
          </p>
        </div>

        <div>
          {isClient ? (
            <Link to="/portal-cliente" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={18} />
              <span>Solicitar Nuevo Evento</span>
            </Link>
          ) : isSupervisor ? (
            <Link to="/calendario" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={18} />
              <span>Abrir Calendario Operativo</span>
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/eventos" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} />
                <span>Gestionar Eventos</span>
              </Link>
              <Link to="/usuarios" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} />
                <span>Usuarios</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 7.1 EXPERIENCIA PARA ADMINISTRADOR */}
      {/* ===================================================================== */}
      {isAdmin && (
        <>
          {/* Métricas Globales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Eventos Registrados
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                  <Calendar size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : eventos.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {eventosPendientes.length} pendientes · {eventosConfirmados.length} confirmados
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Clientes Activos
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                  <Users size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : clientes.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Cuentas de clientes en base de datos
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Usuarios del Sistema
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
                  <UserCheck size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : usuarios.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Administradores, supervisores y clientes
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Agendas Programadas
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-info)' }}>
                  <CalendarDays size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : (scheduleSummary.all || schedules.length)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Actividades registradas en calendario
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Catálogo de Servicios
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                  <Briefcase size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : servicios.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Servicios disponibles comercialmente
              </div>
            </div>
          </div>

          {/* Accesos Rápidos Administrativos */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} />
              <span>Accesos Rápidos de Administración</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <Link to="/usuarios" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
                <UserCheck size={18} style={{ color: 'var(--gold-primary)' }} />
                <span>Gestión Usuarios</span>
              </Link>
              <Link to="/roles" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
                <Shield size={18} style={{ color: 'var(--gold-primary)' }} />
                <span>Catálogo Roles</span>
              </Link>
              <Link to="/clientes" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
                <Users size={18} style={{ color: 'var(--gold-primary)' }} />
                <span>Directorio Clientes</span>
              </Link>
              <Link to="/eventos" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
                <Calendar size={18} style={{ color: 'var(--gold-primary)' }} />
                <span>Gestión Eventos</span>
              </Link>
              <Link to="/servicios" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
                <Briefcase size={18} style={{ color: 'var(--gold-primary)' }} />
                <span>Servicios</span>
              </Link>
              <Link to="/calendario" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
                <CalendarDays size={18} style={{ color: 'var(--gold-primary)' }} />
                <span>Calendario General</span>
              </Link>
            </div>
          </div>

          {/* Estado de Servicios del Sistema */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} />
              <span>Estado Técnico de la Infraestructura</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Motor de Base de Datos</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} />
                  <span>MySQL 8.0 Conectado</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Base: nexoeventos (utf8mb4)
                </div>
              </div>

              <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sincronización en Vivo</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Socket.IO Activo</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Eventos reactivos bidireccionales
                </div>
              </div>

              <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zona Horaria Oficial</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} style={{ color: 'var(--gold-primary)' }} />
                  <span>America/Costa_Rica</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Alineación estricta UTC-6
                </div>
              </div>

              <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Control de Accesos (RBAC)</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} />
                  <span>Activo (JWT HS256)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Bloqueo estricto 403 en backend
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 7.2 EXPERIENCIA PARA SUPERVISOR (OPERATIVA, SIN LLAMADAS A USUARIOS) */}
      {/* ===================================================================== */}
      {isSupervisor && (
        <>
          {/* Métricas Operativas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div className="card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Eventos Confirmados
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : eventosConfirmados.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Listos para vincular a cronogramas
              </div>
            </div>

            <div className="card" style={{ borderLeft: eventosPendientes.length > 0 ? '4px solid #F59E0B' : '4px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Pendientes de Revisión
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  <Clock size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: eventosPendientes.length > 0 ? '#F59E0B' : '#FFFFFF' }}>
                {loading ? '...' : eventosPendientes.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Solicitudes comerciales por aprobar
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Agendas Registradas
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-info)' }}>
                  <CalendarDays size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : schedules.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Actividades operativas en calendario
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Clientes Registrados
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                  <Users size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : clientes.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Cartera de clientes asignada
              </div>
            </div>
          </div>

          {/* Sección de Aprobación de Eventos Comerciales Pendientes */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} />
                  <span>Eventos Comerciales Pendientes de Aprobación</span>
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Al confirmar un evento, este queda habilitado automáticamente para vincularse a actividades en el Calendario.
                </p>
              </div>
              {eventosPendientes.length > 0 && (
                <span className="badge badge-pendiente" style={{ fontSize: '0.8125rem' }}>
                  {eventosPendientes.length} pendiente{eventosPendientes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando solicitudes...</p>
              </div>
            ) : eventosPendientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--accent-success)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Todas las solicitudes comerciales están al día
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  No existen eventos comerciales en espera de confirmación. Puedes proceder a organizar la agenda de los eventos confirmados.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre del Evento</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Ubicación</th>
                      <th style={{ textAlign: 'right' }}>Acción Inmediata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosPendientes.map((evt) => (
                      <tr key={evt.id_evento}>
                        <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{evt.id_evento}</td>
                        <td style={{ fontWeight: 600 }}>{evt.nombre}</td>
                        <td>{evt.nombre_cliente || `Cliente #${evt.id_cliente}`}</td>
                        <td>{evt.tipo_evento}</td>
                        <td>{evt.fecha_evento}</td>
                        <td>{evt.ubicacion}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveEvent(evt.id_evento)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--gold-gradient)', color: '#0A0C10', fontWeight: 600 }}
                            title="Aprobar y pasar a estado confirmado"
                          >
                            <Check size={14} />
                            <span>Aprobar y Confirmar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Próximas Actividades Operativas con Responsable (PIC) */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarDays size={18} />
                  <span>Próximas Actividades en Calendario</span>
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Monitoreo de responsabilidades asignadas (PIC) y fechas límite de ejecución
                </p>
              </div>
              <Link to="/calendario" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Ir al Calendario</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <CalendarDays size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem' }} />
                <p>No hay actividades programadas próximamente.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {schedules.slice(0, 4).map((sch) => (
                  <div key={sch.id_agenda} style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `4px solid ${sch.categoria_color || 'var(--gold-primary)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                        {sch.titulo}
                      </span>
                      <span className="badge" style={{ backgroundColor: `${sch.categoria_color || '#D4AF37'}22`, color: sch.categoria_color || 'var(--gold-primary)', border: `1px solid ${sch.categoria_color || '#D4AF37'}55` }}>
                        {sch.categoria_nombre || sch.categoria}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={13} style={{ color: 'var(--gold-primary)' }} />
                        <span>{sch.fecha_inicio ? sch.fecha_inicio.substring(0, 16).replace('T', ' ') : 'Sin fecha'}</span>
                      </div>
                      {sch.lugar && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={13} style={{ color: 'var(--text-dim)' }} />
                          <span>{sch.lugar}</span>
                        </div>
                      )}
                    </div>

                    {/* Responsable Principal (PIC) */}
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid var(--border-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--gold-gradient)',
                          color: '#0A0C10',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {sch.responsable_nombre ? sch.responsable_nombre.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {sch.responsable_nombre || 'Sin Responsable Asignado'}
                        </span>
                      </div>
                      {sch.responsable_rol && (
                        <span className={`badge badge-rol-${sch.responsable_rol.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                          {sch.responsable_rol}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 7.3 EXPERIENCIA PARA CLIENTE (SEGUIMIENTO PERSONAL Y TRANSPARENTE) */}
      {/* ===================================================================== */}
      {isClient && (
        <>
          {/* Métricas Personales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Mis Eventos Solicitados
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                  <Calendar size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : eventos.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Eventos creados bajo tu perfil
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Eventos Confirmados
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : eventosConfirmados.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                En etapa activa de coordinación y producción
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Servicios Disponibles
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-info)' }}>
                  <Briefcase size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                {loading ? '...' : servicios.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Catering, Sonido, Fotografía, Iluminación
              </div>
            </div>
          </div>

          {/* Tarjetas de Seguimiento de Eventos del Cliente */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} />
                  <span>Estado de Mis Eventos Contratados</span>
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Visualiza el progreso de tu evento y los detalles de locación y fecha
                </p>
              </div>
              <Link to="/portal-cliente" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PlusCircle size={14} />
                <span>Solicitar Nuevo</span>
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Consultando tus eventos...</p>
              </div>
            ) : eventos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <Calendar size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-dim)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Aún no tienes eventos solicitados
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Comienza solicitando la cotización y planificación de tu próxima boda, fiesta o evento corporativo.
                </p>
                <Link to="/portal-cliente" className="btn btn-primary">
                  <PlusCircle size={16} />
                  <span>Solicitar Evento Ahora</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {eventos.map((evt) => (
                  <div key={evt.id_evento} style={{
                    padding: '1.25rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-gold)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-primary)', letterSpacing: '0.05em' }}>
                            EVENTO #{evt.id_evento}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', marginTop: '0.2rem' }}>
                            {evt.nombre}
                          </h3>
                        </div>
                        <span className={`badge badge-${evt.estado}`}>
                          {evt.estado}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '1rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={15} style={{ color: 'var(--gold-primary)' }} />
                          <span>Fecha programada: <strong>{evt.fecha_evento}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={15} style={{ color: 'var(--gold-primary)' }} />
                          <span>Lugar: <strong>{evt.ubicacion}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Briefcase size={15} style={{ color: 'var(--gold-primary)' }} />
                          <span>Tipo: <strong>{evt.tipo_evento}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8125rem'
                    }}>
                      {evt.estado === 'pendiente' && (
                        <p style={{ color: '#F59E0B', margin: 0 }}>
                          Tu solicitud está en fase de revisión por un supervisor de NexoEventos. Pronto nos comunicaremos contigo.
                        </p>
                      )}
                      {evt.estado === 'confirmado' && (
                        <p style={{ color: 'var(--accent-success)', margin: 0 }}>
                          Evento confirmado y en fase de producción. El equipo logístico está coordinando los detalles.
                        </p>
                      )}
                      {evt.estado === 'completado' && (
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                          Evento finalizado con éxito. Gracias por confiar en NexoEventos.
                        </p>
                      )}
                      {evt.estado === 'cancelado' && (
                        <p style={{ color: 'var(--accent-danger)', margin: 0 }}>
                          Esta solicitud ha sido cancelada.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta de Contacto Directo y Coordinación */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={18} />
              <span>Canal de Atención y Coordinación Personalizada</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Línea Directa</div>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={16} style={{ color: 'var(--gold-primary)' }} />
                  <span>+506 2222-NEXO (6396)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Atención telefónica prioritaria
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correo Electrónico</div>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={16} style={{ color: 'var(--gold-primary)' }} />
                  <span>coordinacion@nexoeventos.com</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Respuesta en menos de 24 horas
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horario de Oficina</div>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} style={{ color: 'var(--gold-primary)' }} />
                  <span>Lunes a Viernes 08:00 - 18:00</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Hora estándar de Costa Rica (UTC-6)
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* TABLA DE EVENTOS RECIENTES COMÚN (PARA ADMIN Y OPERACIONES) */}
      {/* ===================================================================== */}
      {isAdmin && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)' }}>
                Registro Global de Eventos Recientes
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Últimos eventos incorporados al sistema
              </p>
            </div>
            <Link to="/eventos" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Ver Todos</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Consultando base de datos...</p>
            </div>
          ) : eventos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-dim)' }} />
              <p>No se encontraron eventos registrados.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Evento</th>
                    <th>Cliente Titular</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.slice(0, 5).map((evt) => (
                    <tr key={evt.id_evento}>
                      <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{evt.id_evento}</td>
                      <td style={{ fontWeight: 600 }}>{evt.nombre}</td>
                      <td>{evt.nombre_cliente || `Cliente #${evt.id_cliente}`}</td>
                      <td>{evt.tipo_evento}</td>
                      <td>{evt.fecha_evento}</td>
                      <td>{evt.ubicacion}</td>
                      <td>
                        <span className={`badge badge-${evt.estado}`}>
                          {evt.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
