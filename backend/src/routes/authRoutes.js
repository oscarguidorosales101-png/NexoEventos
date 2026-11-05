import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rutas protegidas por JWT
router.get('/me', authMiddleware, AuthController.getMe);
router.put('/profile', authMiddleware, AuthController.updateProfile);

export default router;

