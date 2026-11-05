import { Router } from 'express';
import { RolController } from '../controllers/rolController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas las operaciones sobre roles requieren autenticación y rol de Administrador
router.use(authMiddleware, requireAdmin);

router.get('/', RolController.getAll);
router.get('/:id', RolController.getById);
router.post('/', RolController.create);
router.put('/:id', RolController.update);
router.delete('/:id', RolController.delete);

export default router;

