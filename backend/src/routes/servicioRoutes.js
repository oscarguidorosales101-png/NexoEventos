import { Router } from 'express';
import { ServicioController } from '../controllers/servicioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de servicios requieren usuario autenticado
router.use(authMiddleware);

router.get('/', ServicioController.getAll);
router.get('/:id', ServicioController.getById);
router.post('/', ServicioController.create);
router.put('/:id', ServicioController.update);
router.delete('/:id', ServicioController.delete);

export default router;

