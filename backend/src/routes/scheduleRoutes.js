import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de calendario requieren sesión autenticada con JWT
router.use(authMiddleware);

// Rutas de consulta global y vistas estructuradas
router.get('/', ScheduleController.getAll);
router.get('/summary', ScheduleController.getSummary);
router.get('/week', ScheduleController.getWeek);
router.get('/day', ScheduleController.getDay);
router.get('/categories', ScheduleController.getCategories);
router.get('/team-candidates', ScheduleController.getStaffCandidates);
router.get('/export/ics', ScheduleController.exportICS);

// Rutas de notas por ID de nota
router.patch('/notes/:id', ScheduleController.updateNote);
router.delete('/notes/:id', ScheduleController.deleteNote);

// Rutas operativas de agenda por ID
router.get('/:id', ScheduleController.getById);
router.get('/:id/export/ics', ScheduleController.exportSingleICS);
router.post('/', ScheduleController.create);
router.patch('/:id', ScheduleController.update);
router.patch('/:id/reschedule', ScheduleController.reschedule);
router.delete('/:id', ScheduleController.delete);

// Notas por ID de agenda
router.get('/:id/notes', ScheduleController.getNotes);
router.post('/:id/notes', ScheduleController.createNote);

// Asignación de equipo por ID de agenda
router.post('/:id/team', ScheduleController.addTeamMember);
router.delete('/:id/team/:userId', ScheduleController.removeTeamMember);

export default router;

