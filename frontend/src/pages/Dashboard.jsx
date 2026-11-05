import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { eventoService } from '../services/eventoService.js';
import { clienteService } from '../services/clienteService.js';
import { servicioService } from '../services/servicioService.js';
import { usuarioService } from '../services/usuarioService.js';
import {
  Calendar,
  Users,
  Briefcase,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

export const Dashboard = () => {
  const { user, isAdmin, isSupervisor, isClient } = useAuth();
  const [stats, setStats] = useState({
    clientes: 0,
    servicios: 0,
    eventos: 0,
    usuarios: 0,
    eventosPendientes: 0,
    eventosConfirmados: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const eventosData = await eventoService.getAll();
        setRecentEvents(eventosData.slice(0, 5));

        const pendientes = eventosData.filter(e => e.estado === 'pendiente').length;
        const confirmados = eventosData.filter(e => e.estado === 'confirmado' || e.estado === 'completado').length;

        if (isAdmin || isSupervisor) {
          const [clientesData, serviciosData, usuariosData] = await Promise.all([
            clienteService.getAll().catch(() => []),
            servicioService.getAll().catch(() => []),
            usuarioService.getAll().catch(() => [])
          ]);

          setStats({
            clientes: clientesData.length,
            servicios: serviciosData.length,
            eventos: eventosData.length,
            usuarios: usuariosData.length,
            eventosPendientes: pendientes,
            eventosConfirmados: confirmados
          });
        } else {
          // Cliente
          const serviciosData = await servicioService.getAll().catch(() => []);
          setStats({
            clientes: 1,
            servicios: serviciosData.length,
            eventos: eventosData.length,
            usuarios: 1,
            eventosPendientes: pendientes,
            eventosConfirmados: confirmados
          });
        }
      } catch (err) {
        console.error('Error cargando métricas de dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAdmin, isSupervisor, isClient]);

  return (
    <div>
      {/* Banner de Bienvenida */}
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
            Panel Principal de Control
          </span>
          <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
            Bienvenido, <span style={{ color: 'var(--gold-primary)' }}>{user?.nombre}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isAdmin && 'Tiene acceso total administrativo sobre todas las entidades y la configuración del sistema.'}
            {isSupervisor && 'Tiene permisos de gestión operativa sobre clientes, eventos, servicios y supervisión de usuarios.'}
            {isClient && 'Aquí puede consultar el estado de sus eventos programados y solicitar nuevos servicios exclusivos.'}
          </p>
        </div>

        <div>
          {isClient ? (
            <Link to="/portal-cliente" className="btn btn-primary">
              <PlusCircle size={18} />
              <span>Solicitar Nuevo Evento</span>
            </Link>
          ) : (
            <Link to="/eventos" className="btn btn-primary">
              <PlusCircle size={18} />
              <span>Gestionar Eventos</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        {(isAdmin || isSupervisor) && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Clientes
              </span>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
              {loading ? '...' : stats.clientes}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Personas y empresas registradas
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {isClient ? 'Mis Eventos' : 'Total Eventos'}
            </span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
            {loading ? '...' : stats.eventos}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            {stats.eventosPendientes} pendientes · {stats.eventosConfirmados} confirmados
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Catálogo Servicios
            </span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-info)' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>
            {loading ? '...' : stats.servicios}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Servicios corporativos activos
          </div>
        </div>

        {(isAdmin || isSupervisor) && (
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
              {loading ? '...' : stats.usuarios}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Cuentas activas en MySQL
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Eventos Recientes */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)' }}>
              {isClient ? 'Mis Últimos Eventos Solicitados' : 'Eventos Recientes en Planificación'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Seguimiento de fechas, locaciones y estado de confirmación
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
        ) : recentEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-dim)' }} />
            <p>No se encontraron eventos registrados en este momento.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Evento</th>
                  {!isClient && <th>Cliente Titular</th>}
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((evt) => (
                  <tr key={evt.id_evento}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{evt.id_evento}</td>
                    <td style={{ fontWeight: 600 }}>{evt.nombre}</td>
                    {!isClient && <td>{evt.nombre_cliente}</td>}
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
    </div>
  );
};

