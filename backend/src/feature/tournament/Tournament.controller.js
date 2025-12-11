import { Tournament, Player, TournamentPlayer, Match } from '../../config/associations.js';
import { generateDoubleEliminationBracket } from './bracket.service.js';
import { Op } from 'sequelize';

// Controller: Tournament
export const TournamentController = {
    // GET /api/tournaments - Listar todos os torneios
    async findAll(req, res, next) {
        try {
            const { status } = req.query;
            const where = {};

            if (status) {
                where.status = status;
            }

            const tournaments = await Tournament.findAll({
                where,
                include: [
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ],
                order: [['startDate', 'DESC']]
            });

            res.json(tournaments);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/tournaments/:id - Buscar torneio por ID
    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const tournament = await Tournament.findByPk(id, {
                include: [
                    { model: Player, as: 'players', through: { attributes: ['seed', 'status', 'wins', 'losses'] } },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ]
            });

            if (!tournament) {
                return res.status(404).json({ message: 'Torneio não encontrado' });
            }

            res.json(tournament);
        } catch (error) {
            next(error);
        }
    },

    // POST /api/tournaments - Criar torneio com jogadores e gerar bracket
    async create(req, res, next) {
        try {
            const { name, description, startDate, matchFormat, playerIds, maxPlayers } = req.body;

            // Validar número de jogadores
            const playerCount = playerIds?.length || 0;
            if (playerCount < 4) {
                return res.status(400).json({ message: 'Mínimo de 4 jogadores necessário' });
            }

            // Deve ser potência de 2
            if ((playerCount & (playerCount - 1)) !== 0) {
                return res.status(400).json({ message: 'Número de jogadores deve ser potência de 2 (4, 8, 16, 32)' });
            }

            // Criar torneio
            const tournament = await Tournament.create({
                name,
                description,
                startDate,
                matchFormat: matchFormat || 'MD3',
                maxPlayers: playerCount,
                currentPlayers: playerCount,
                status: 'active'
            });

            // Adicionar jogadores ao torneio com seeds aleatórios
            const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

            for (let i = 0; i < shuffledPlayers.length; i++) {
                await TournamentPlayer.create({
                    tournamentId: tournament.id,
                    playerId: shuffledPlayers[i],
                    seed: i + 1
                });
            }

            // Gerar chaveamento de Dupla Eliminação
            await generateDoubleEliminationBracket(tournament.id, shuffledPlayers);

            res.status(201).json(tournament);
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/tournaments/:id - Atualizar torneio
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, startDate, status } = req.body;

            const tournament = await Tournament.findByPk(id);
            if (!tournament) {
                return res.status(404).json({ message: 'Torneio não encontrado' });
            }

            await tournament.update({
                name: name || tournament.name,
                description: description !== undefined ? description : tournament.description,
                startDate: startDate || tournament.startDate,
                status: status || tournament.status
            });

            res.json(tournament);
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/tournaments/:id - Deletar torneio
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            const tournament = await Tournament.findByPk(id);
            if (!tournament) {
                return res.status(404).json({ message: 'Torneio não encontrado' });
            }

            // Deletar partidas e inscrições relacionadas
            await Match.destroy({ where: { tournamentId: id } });
            await TournamentPlayer.destroy({ where: { tournamentId: id } });
            await tournament.destroy();

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    // GET /api/tournaments/:id/matches - Listar partidas do torneio
    async getMatches(req, res, next) {
        try {
            const { id } = req.params;

            const matches = await Match.findAll({
                where: { tournamentId: id },
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ],
                order: [
                    ['bracketType', 'ASC'],
                    ['round', 'ASC'],
                    ['position', 'ASC']
                ]
            });

            res.json(matches);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/tournaments/:id/players - Listar jogadores do torneio
    async getPlayers(req, res, next) {
        try {
            const { id } = req.params;

            const players = await TournamentPlayer.findAll({
                where: { tournamentId: id },
                include: [
                    { model: Player, as: 'player' }
                ],
                order: [['seed', 'ASC']]
            });

            res.json(players);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/tournaments/:id/stats - Estatísticas e ranking do torneio
    async getStats(req, res, next) {
        try {
            const { id } = req.params;

            // Buscar torneio
            const tournament = await Tournament.findByPk(id, {
                include: [{ model: Player, as: 'winner', attributes: ['id', 'nickname'] }]
            });

            if (!tournament) {
                return res.status(404).json({ message: 'Torneio não encontrado' });
            }

            // Buscar todos os jogadores do torneio com suas estatísticas
            const tournamentPlayers = await TournamentPlayer.findAll({
                where: { tournamentId: id },
                include: [
                    { model: Player, as: 'player', attributes: ['id', 'nickname', 'tag', 'clan'] }
                ]
            });

            // Buscar todas as partidas do torneio
            const matches = await Match.findAll({
                where: { tournamentId: id },
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ],
                order: [['bracketType', 'ASC'], ['round', 'ASC']]
            });

            // Calcular estatísticas por jogador
            const playerStats = tournamentPlayers.map(tp => {
                const playerId = tp.playerId;
                const playerMatches = matches.filter(m =>
                    m.player1Id === playerId || m.player2Id === playerId
                );

                let wins = 0;
                let losses = 0;
                const roundsPlayed = { upper: [], lower: [] };

                playerMatches.forEach(m => {
                    if (m.winnerId === playerId) {
                        wins++;
                    } else if (m.winnerId && m.winnerId !== playerId) {
                        losses++;
                    }

                    // Registrar rounds jogados
                    if (m.bracketType === 'upper' || m.bracketType === 'grand_final') {
                        if (!roundsPlayed.upper.includes(m.round)) {
                            roundsPlayed.upper.push(m.round);
                        }
                    } else if (m.bracketType === 'lower') {
                        if (!roundsPlayed.lower.includes(m.round)) {
                            roundsPlayed.lower.push(m.round);
                        }
                    }
                });

                const total = wins + losses;
                const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

                return {
                    player: tp.player,
                    seed: tp.seed,
                    status: tp.status,
                    finalPlacement: tp.finalPlacement,
                    wins,
                    losses,
                    winRate,
                    matchesPlayed: total,
                    roundsPlayed
                };
            });

            // Ordenar por win rate, depois por vitórias
            playerStats.sort((a, b) => {
                if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                if (b.wins !== a.wins) return b.wins - a.wins;
                return a.losses - b.losses;
            });

            // Estatísticas gerais do torneio
            const completedMatches = matches.filter(m => m.winnerId);
            const pendingMatches = matches.filter(m => !m.winnerId);

            res.json({
                tournament: {
                    id: tournament.id,
                    name: tournament.name,
                    status: tournament.status,
                    matchFormat: tournament.matchFormat,
                    winner: tournament.winner
                },
                summary: {
                    totalPlayers: tournamentPlayers.length,
                    totalMatches: matches.length,
                    completedMatches: completedMatches.length,
                    pendingMatches: pendingMatches.length,
                    progress: matches.length > 0
                        ? Math.round((completedMatches.length / matches.length) * 100)
                        : 0
                },
                ranking: playerStats
            });
        } catch (error) {
            next(error);
        }
    }
};
