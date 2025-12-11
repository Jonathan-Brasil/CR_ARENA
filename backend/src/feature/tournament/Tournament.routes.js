import { Router } from 'express';
import { TournamentController } from './Tournament.controller.js';

const router = Router();

// Rotas de Torneio
router.get('/', TournamentController.findAll);
router.get('/:id', TournamentController.findById);
router.get('/:id/matches', TournamentController.getMatches);
router.get('/:id/players', TournamentController.getPlayers);
router.get('/:id/stats', TournamentController.getStats);
router.post('/', TournamentController.create);
router.put('/:id', TournamentController.update);
router.delete('/:id', TournamentController.delete);

export default router;
