import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de clientes requieren token válido
router.use(authMiddleware);

router.get('/', ClienteController.getAll);
router.get('/:id', ClienteController.getById);
router.post('/', ClienteController.create);
router.put('/:id', ClienteController.update);
router.delete('/:id', ClienteController.delete);

export default router;

