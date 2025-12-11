import { Match, Player, Tournament, TournamentPlayer } from '../../config/associations.js';
import { Op } from 'sequelize';

// Controller: Match
export const MatchController = {
    // GET /api/matches/:id - Buscar partida por ID
    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const match = await Match.findByPk(id, {
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] },
                    { model: Tournament, as: 'tournament', attributes: ['id', 'name', 'matchFormat'] }
                ]
            });

            if (!match) {
                return res.status(404).json({ message: 'Partida não encontrada' });
            }

            res.json(match);
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/matches/:id/result - Registrar resultado da partida
    async updateResult(req, res, next) {
        try {
            const { id } = req.params;
            const { player1Score, player2Score, winnerId } = req.body;

            const match = await Match.findByPk(id, {
                include: [
                    { model: Tournament, as: 'tournament' },
                    { model: Player, as: 'player1' },
                    { model: Player, as: 'player2' }
                ]
            });

            if (!match) {
                return res.status(404).json({ message: 'Partida não encontrada' });
            }

            if (match.winnerId) {
                return res.status(400).json({ message: 'Partida já finalizada' });
            }

            if (!match.player1Id || !match.player2Id) {
                return res.status(400).json({ message: 'Partida ainda não tem ambos os jogadores' });
            }

            // Validar que o winnerId é um dos jogadores
            if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
                return res.status(400).json({ message: 'Vencedor deve ser um dos jogadores da partida' });
            }

            // Validar pontuação MDX
            const format = match.tournament.matchFormat;
            const winsRequired = format === 'MD5' ? 3 : format === 'MD7' ? 4 : 2;

            const winnerScore = winnerId === match.player1Id ? player1Score : player2Score;
            if (winnerScore < winsRequired) {
                return res.status(400).json({
                    message: `Vencedor precisa de ${winsRequired} vitórias no formato ${format}`
                });
            }

            // Determinar perdedor
            const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

            // Atualizar partida
            await match.update({
                player1Score,
                player2Score,
                winnerId,
                loserId,
                completedAt: new Date()
            });

            // ================================
            // ATUALIZAR ESTATÍSTICAS
            // ================================

            // Atualizar estatísticas globais do jogador
            await Player.increment('wins', { where: { id: winnerId } });
            await Player.increment('losses', { where: { id: loserId } });

            // Atualizar estatísticas do torneio
            await TournamentPlayer.increment('wins', {
                where: { tournamentId: match.tournamentId, playerId: winnerId }
            });
            await TournamentPlayer.increment('losses', {
                where: { tournamentId: match.tournamentId, playerId: loserId }
            });

            // ================================
            // PROGRESSÃO AUTOMÁTICA
            // ================================

            // Vencedor avança para próxima partida
            if (match.nextMatchId) {
                const nextMatch = await Match.findByPk(match.nextMatchId);
                if (nextMatch) {
                    // Preencher o primeiro slot vazio
                    if (!nextMatch.player1Id) {
                        await nextMatch.update({ player1Id: winnerId });
                    } else if (!nextMatch.player2Id) {
                        await nextMatch.update({ player2Id: winnerId });
                    }
                }
            }

            // Perdedor vai para Lower Bracket (se existir loserNextMatchId)
            if (match.loserNextMatchId && match.bracketType === 'upper') {
                const loserNextMatch = await Match.findByPk(match.loserNextMatchId);
                if (loserNextMatch) {
                    if (!loserNextMatch.player1Id) {
                        await loserNextMatch.update({ player1Id: loserId });
                    } else if (!loserNextMatch.player2Id) {
                        await loserNextMatch.update({ player2Id: loserId });
                    }
                }
            }

            // Se for Lower Bracket e não tem próxima partida, jogador foi eliminado
            if (match.bracketType === 'lower' && !match.nextMatchId) {
                await TournamentPlayer.update(
                    { status: 'eliminated' },
                    { where: { tournamentId: match.tournamentId, playerId: loserId } }
                );
            }

            // Se for Grand Final, atualizar status do torneio
            if (match.bracketType === 'grand_final') {
                await Tournament.update(
                    { status: 'finished', winnerId },
                    { where: { id: match.tournamentId } }
                );

                await TournamentPlayer.update(
                    { status: 'winner', finalPlacement: 1 },
                    { where: { tournamentId: match.tournamentId, playerId: winnerId } }
                );

                await TournamentPlayer.update(
                    { status: 'eliminated', finalPlacement: 2 },
                    { where: { tournamentId: match.tournamentId, playerId: loserId } }
                );
            }

            // Recarregar match com dados atualizados
            const updatedMatch = await Match.findByPk(id, {
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ]
            });

            res.json(updatedMatch);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/matches - Listar todas as partidas (com filtros opcionais)
    async findAll(req, res, next) {
        try {
            const { tournamentId, bracketType, completed } = req.query;
            const where = {};

            if (tournamentId) where.tournamentId = tournamentId;
            if (bracketType) where.bracketType = bracketType;
            if (completed === 'true') where.winnerId = { [Op.ne]: null };
            if (completed === 'false') where.winnerId = null;

            const matches = await Match.findAll({
                where,
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] },
                    { model: Tournament, as: 'tournament', attributes: ['id', 'name'] }
                ],
                order: [
                    ['tournamentId', 'DESC'],
                    ['bracketType', 'ASC'],
                    ['round', 'ASC'],
                    ['position', 'ASC']
                ]
            });

            res.json(matches);
        } catch (error) {
            next(error);
        }
    }
};
