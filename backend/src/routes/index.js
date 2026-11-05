import { Router } from 'express';
import authRoutes from './authRoutes.js';
import rolRoutes from './rolRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import servicioRoutes from './servicioRoutes.js';
import eventoRoutes from './eventoRoutes.js';
import detalleEventoRoutes from './detalleEventoRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';

const router = Router();

// Endpoint de diagnóstico / health check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'NexoEventos API',
    version: '2.0.0',
    timezone: 'America/Costa_Rica',
    timestamp: new Date().toISOString()
  });
});

// Registro de rutas modulares
router.use('/auth', authRoutes);
router.use('/roles', rolRoutes);
router.use('/clientes', clienteRoutes);
router.use('/servicios', servicioRoutes);
router.use('/eventos', eventoRoutes);
router.use('/detalle-eventos', detalleEventoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/schedules', scheduleRoutes);

export default router;
