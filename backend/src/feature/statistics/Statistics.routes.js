import { Router } from 'express';
import { StatsController } from '../stats/Stats.controller.js';

const router = Router();

// Rota de Estatísticas Globais
router.get('/', StatsController.getGlobalStats);

export default router;
