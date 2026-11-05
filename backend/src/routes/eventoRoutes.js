import { Router } from 'express';
import { EventoController } from '../controllers/eventoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de eventos requieren usuario autenticado
router.use(authMiddleware);

router.get('/', EventoController.getAll);
router.get('/:id', EventoController.getById);
router.post('/', EventoController.create);
router.put('/:id', EventoController.update);
router.delete('/:id', EventoController.delete);

export default router;

