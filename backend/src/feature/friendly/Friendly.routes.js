import { Router } from 'express';
import { FriendlyController } from './Friendly.controller.js';

const router = Router();

// Rotas de Amistoso
router.get('/', FriendlyController.findAll);
router.get('/:id', FriendlyController.findById);
router.get('/player/:playerId', FriendlyController.getPlayerFriendlies);
router.post('/', FriendlyController.create);
router.put('/:id/result', FriendlyController.updateResult);
router.delete('/:id', FriendlyController.delete);

export default router;
