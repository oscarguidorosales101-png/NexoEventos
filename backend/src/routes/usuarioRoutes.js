import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireStaff, requireAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas las rutas de usuarios requieren autenticación
router.use(authMiddleware);

// Administradores y Supervisores pueden listar y consultar
router.get('/', requireStaff, UsuarioController.getAll);
router.get('/:id', requireStaff, UsuarioController.getById);

// Exclusivo para Administrador: crear, actualizar y eliminar cuentas
router.post('/', requireAdmin, UsuarioController.create);
router.put('/:id', requireAdmin, UsuarioController.update);
router.delete('/:id', requireAdmin, UsuarioController.delete);

export default router;

