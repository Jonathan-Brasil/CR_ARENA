import { Router } from 'express';
import { PlayerController } from './Player.controller.js';

const router = Router();

// Rotas de Jogador
router.get('/', PlayerController.findAll);
router.get('/:id', PlayerController.findById);
router.get('/:id/matches', PlayerController.getMatches);
router.get('/:id/tournaments', PlayerController.getTournaments);
router.get('/:id/stats/:tournamentId', PlayerController.getTournamentStats);
router.post('/', PlayerController.create);
router.put('/:id', PlayerController.update);
router.delete('/:id', PlayerController.delete);

export default router;
