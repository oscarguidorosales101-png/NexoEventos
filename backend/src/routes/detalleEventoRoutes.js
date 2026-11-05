import { Router } from 'express';
import { DetalleEventoController } from '../controllers/detalleEventoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de detalle_eventos requieren usuario autenticado
router.use(authMiddleware);

router.get('/', DetalleEventoController.getAll);
router.get('/:id', DetalleEventoController.getById);
router.post('/', DetalleEventoController.create);
router.put('/:id', DetalleEventoController.update);
router.delete('/:id', DetalleEventoController.delete);

export default router;

