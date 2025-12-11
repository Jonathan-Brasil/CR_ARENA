import { Router } from 'express';
import { StatsController } from './Stats.controller.js';

const router = Router();

// Rotas de Estatísticas
router.get('/', StatsController.getDashboardStats);

export default router;
