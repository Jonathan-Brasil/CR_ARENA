import { Router } from 'express';
import { MatchController } from './Match.controller.js';

const router = Router();

// Rotas de Partida
router.get('/', MatchController.findAll);
router.get('/:id', MatchController.findById);
router.put('/:id/result', MatchController.updateResult);

export default router;
