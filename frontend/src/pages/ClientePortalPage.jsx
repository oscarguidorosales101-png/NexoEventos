import React, { useState, useEffect } from 'react';
import { eventoService } from '../services/eventoService.js';
import { servicioService } from '../services/servicioService.js';
import { detalleEventoService } from '../services/detalleEventoService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';

export const ClientePortalPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_evento: 'Boda',
    fecha_evento: '',
    ubicacion: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await servicioService.getAll();
        setServiciosDisponibles(data.filter(s => s.estado === 'activo'));
      } catch (err) {
        setError('Error al consultar el catálogo de servicios');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleServiceToggle = (id_servicio, precio) => {
    setSelectedServices(prev => {
      const copy = { ...prev };
      if (copy[id_servicio]) {
        delete copy[id_servicio];
      } else {
        copy[id_servicio] = { cantidad: 1, precio: Number(precio) };
      }
      return copy;
    });
  };

  const handleQuantityChange = (id_servicio, cantidad) => {
    setSelectedServices(prev => ({
      ...prev,
      [id_servicio]: {
        ...prev[id_servicio],
        cantidad: Math.max(1, parseInt(cantidad, 10) || 1)
      }
    }));
  };

  const estimatedTotal = Object.entries(selectedServices).reduce((acc, [_, item]) => {
    return acc + (item.cantidad * item.precio);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // 1. Crear el evento (asociado automáticamente al id_cliente autenticado)
      const nuevoEvento = await eventoService.create({
        nombre: formData.nombre,
        tipo_evento: formData.tipo_evento,
        fecha_evento: formData.fecha_evento,
        ubicacion: formData.ubicacion
      });

      const idEvento = nuevoEvento.id_evento;

      // 2. Si seleccionó servicios, agregarlos a detalle_eventos
      const servicePromises = Object.entries(selectedServices).map(([id_servicio, item]) => {
        return detalleEventoService.create({
          id_evento: idEvento,
          id_servicio: Number(id_servicio),
          cantidad: item.cantidad,
          precio_unitario: item.precio
        });
      });

      if (servicePromises.length > 0) {
        await Promise.all(servicePromises);
      }

      setSuccess(`¡Solicitud enviada exitosamente! Su evento "#${idEvento} - ${formData.nombre}" ha sido registrado en estado pendiente.`);
      setTimeout(() => {
        navigate('/eventos');
      }, 2500);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Banner de Presentación */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(20, 23, 33, 1) 100%)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'var(--gold-gradient)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0A0C10',
          boxShadow: 'var(--shadow-gold)',
          marginBottom: '1rem'
        }}>
          <Sparkles size={32} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#FFFFFF' }}>
          Portal de Solicitud de Eventos Exclusivos
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0.5rem auto 0', fontSize: '0.95rem' }}>
          Diseñe su celebración o congreso corporativo seleccionando la fecha, lugar y los servicios premium que desea incluir. Nuestro equipo de coordinación lo revisará de inmediato.
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Columna Izquierda: Datos del Evento */}
          <div className="card card-gold">
            <h2 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              <span>1. Información General del Evento</span>
            </h2>

            <div className="form-group">
              <label className="form-label" htmlFor="portal_nombre">Nombre o Título del Evento *</label>
              <input
                id="portal_nombre"
                type="text"
                className="form-control"
                placeholder="Ej. Boda Civil Alejandro y Valeria"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="portal_tipo">Tipo de Evento *</label>
                <select
                  id="portal_tipo"
                  className="form-select"
                  value={formData.tipo_evento}
                  onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                  required
                >
                  <option value="Boda">Boda y Recepción</option>
                  <option value="Corporativo">Convención / Corporativo</option>
                  <option value="Celebración">Cumpleaños / Celebración</option>
                  <option value="Lanzamiento">Lanzamiento de Marca</option>
                  <option value="Gala">Cena de Gala</option>
                  <option value="Graduación">Graduación</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="portal_fecha">Fecha Deseada *</label>
                <input
                  id="portal_fecha"
                  type="date"
                  className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.fecha_evento}
                  onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="portal_ubicacion">Ubicación / Ciudad o Recinto Previsto *</label>
              <input
                id="portal_ubicacion"
                type="text"
                className="form-control"
                placeholder="Ej. Hacienda San Rafael, Salón Principal"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                required
              />
            </div>

            <div style={{ padding: '0.875rem', borderRadius: '8px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                <Clock size={16} />
                <span>Estado Inicial: Pendiente</span>
              </div>
              Su solicitud será ingresada en estado pendiente para evaluación de disponibilidad por parte de nuestros coordinadores.
            </div>
          </div>

          {/* Columna Derecha: Catálogo de Servicios a Agregar */}
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              2. Servicios Recomendados
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              Seleccione los servicios que le gustaría incorporar:
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargando catálogo...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {serviciosDisponibles.map(s => {
                  const isSelected = !!selectedServices[s.id_servicio];
                  return (
                    <div
                      key={s.id_servicio}
                      style={{
                        padding: '0.875rem',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-input)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', flex: 1 }}>
                          <input
                            type="checkbox"
                            style={{ marginTop: '0.25rem', accentColor: 'var(--gold-primary)' }}
                            checked={isSelected}
                            onChange={() => handleServiceToggle(s.id_servicio, s.precio)}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? 'var(--gold-primary)' : 'var(--text-main)' }}>
                              {s.nombre}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              ${Number(s.precio).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </label>

                        {isSelected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Cant:</span>
                            <input
                              type="number"
                              min="1"
                              value={selectedServices[s.id_servicio].cantidad}
                              onChange={(e) => handleQuantityChange(s.id_servicio, e.target.value)}
                              style={{
                                width: '45px',
                                padding: '0.2rem',
                                textAlign: 'center',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Presupuesto Estimado */}
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Presupuesto Estimado</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                  ${estimatedTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '0.625rem 1.25rem' }}
              >
                {submitting ? 'Enviando...' : 'Confirmar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

