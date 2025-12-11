import { Player, Match, Tournament, TournamentPlayer } from '../../config/associations.js';
import { Op } from 'sequelize';

// Controller: Player
export const PlayerController = {
    // GET /api/players - Listar todos os jogadores
    async findAll(req, res, next) {
        try {
            const players = await Player.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(players);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/players/:id - Buscar jogador por ID
    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const player = await Player.findByPk(id);

            if (!player) {
                return res.status(404).json({ message: 'Jogador não encontrado' });
            }

            res.json(player);
        } catch (error) {
            next(error);
        }
    },

    // POST /api/players - Criar novo jogador
    async create(req, res, next) {
        try {
            const { nickname, tag, clan, trophies } = req.body;

            // Verificar se tag já existe
            const existing = await Player.findOne({ where: { tag } });
            if (existing) {
                return res.status(400).json({ message: 'Tag já cadastrada' });
            }

            const player = await Player.create({
                nickname,
                tag: tag.toUpperCase(),
                clan,
                trophies: trophies || 0
            });

            res.status(201).json(player);
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/players/:id - Atualizar jogador
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { nickname, tag, clan, trophies } = req.body;

            const player = await Player.findByPk(id);
            if (!player) {
                return res.status(404).json({ message: 'Jogador não encontrado' });
            }

            // Se está alterando a tag, verificar duplicata
            if (tag && tag !== player.tag) {
                const existing = await Player.findOne({ where: { tag, id: { [Op.ne]: id } } });
                if (existing) {
                    return res.status(400).json({ message: 'Tag já cadastrada' });
                }
            }

            await player.update({
                nickname: nickname || player.nickname,
                tag: tag ? tag.toUpperCase() : player.tag,
                clan: clan !== undefined ? clan : player.clan,
                trophies: trophies !== undefined ? trophies : player.trophies
            });

            res.json(player);
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/players/:id - Deletar jogador
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            const player = await Player.findByPk(id);
            if (!player) {
                return res.status(404).json({ message: 'Jogador não encontrado' });
            }

            await player.destroy();
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    // GET /api/players/:id/matches - Histórico de partidas do jogador
    async getMatches(req, res, next) {
        try {
            const { id } = req.params;
            const { tournamentId } = req.query;

            const where = {
                [Op.or]: [
                    { player1Id: id },
                    { player2Id: id }
                ]
            };

            // Filtrar por torneio se especificado
            if (tournamentId) {
                where.tournamentId = tournamentId;
            }

            const matches = await Match.findAll({
                where,
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] },
                    { model: Tournament, as: 'tournament', attributes: ['id', 'name'] }
                ],
                order: [['bracketType', 'ASC'], ['round', 'ASC'], ['completedAt', 'DESC']]
            });

            res.json(matches);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/players/:id/tournaments - Listar torneios que o jogador participou
    async getTournaments(req, res, next) {
        try {
            const { id } = req.params;

            const tournamentPlayers = await TournamentPlayer.findAll({
                where: { playerId: id },
                include: [
                    {
                        model: Tournament,
                        as: 'tournament',
                        attributes: ['id', 'name', 'status', 'startDate', 'matchFormat']
                    }
                ],
                order: [[{ model: Tournament, as: 'tournament' }, 'startDate', 'DESC']]
            });

            const tournaments = tournamentPlayers.map(tp => ({
                ...tp.tournament.toJSON(),
                seed: tp.seed,
                status: tp.status,
                finalPlacement: tp.finalPlacement,
                tournamentWins: tp.wins,
                tournamentLosses: tp.losses
            }));

            res.json(tournaments);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/players/:id/stats/:tournamentId - Estatísticas do jogador em um torneio específico
    async getTournamentStats(req, res, next) {
        try {
            const { id, tournamentId } = req.params;

            // Buscar jogador
            const player = await Player.findByPk(id);
            if (!player) {
                return res.status(404).json({ message: 'Jogador não encontrado' });
            }

            // Buscar torneio
            const tournament = await Tournament.findByPk(tournamentId);
            if (!tournament) {
                return res.status(404).json({ message: 'Torneio não encontrado' });
            }

            // Buscar participação do jogador no torneio
            const tournamentPlayer = await TournamentPlayer.findOne({
                where: { playerId: id, tournamentId }
            });

            if (!tournamentPlayer) {
                return res.status(404).json({ message: 'Jogador não participou deste torneio' });
            }

            // Buscar todas as partidas do jogador neste torneio
            const matches = await Match.findAll({
                where: {
                    tournamentId,
                    [Op.or]: [
                        { player1Id: id },
                        { player2Id: id }
                    ]
                },
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ],
                order: [['bracketType', 'DESC'], ['round', 'ASC']]
            });

            // Calcular estatísticas
            let wins = 0;
            let losses = 0;
            const opponents = [];
            const upperBracketPath = [];
            const lowerBracketPath = [];

            matches.forEach(match => {
                const isPlayer1 = match.player1Id === parseInt(id);
                const opponent = isPlayer1 ? match.player2 : match.player1;
                const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
                const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
                const isWin = match.winnerId === parseInt(id);

                if (match.winnerId) {
                    if (isWin) {
                        wins++;
                    } else {
                        losses++;
                    }

                    opponents.push({
                        opponent: opponent ? {
                            id: opponent.id,
                            nickname: opponent.nickname,
                            tag: opponent.tag
                        } : null,
                        result: isWin ? 'win' : 'loss',
                        score: `${playerScore} - ${opponentScore}`,
                        bracketType: match.bracketType,
                        round: match.round
                    });
                }

                // Separar caminho por bracket
                const pathEntry = {
                    matchId: match.id,
                    round: match.round,
                    opponent: opponent ? opponent.nickname : 'TBD',
                    result: match.winnerId ? (isWin ? 'V' : 'D') : 'Pendente',
                    score: match.winnerId ? `${playerScore} - ${opponentScore}` : '-'
                };

                if (match.bracketType === 'upper') {
                    upperBracketPath.push(pathEntry);
                } else if (match.bracketType === 'lower') {
                    lowerBracketPath.push(pathEntry);
                } else if (match.bracketType === 'grand_final') {
                    // Grand Final pode ir em qualquer caminho dependendo de onde veio
                    if (lowerBracketPath.length > 0) {
                        lowerBracketPath.push({ ...pathEntry, round: 'Final' });
                    } else {
                        upperBracketPath.push({ ...pathEntry, round: 'Final' });
                    }
                }
            });

            const total = wins + losses;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

            res.json({
                player: {
                    id: player.id,
                    nickname: player.nickname,
                    tag: player.tag
                },
                tournament: {
                    id: tournament.id,
                    name: tournament.name,
                    status: tournament.status,
                    matchFormat: tournament.matchFormat
                },
                stats: {
                    wins,
                    losses,
                    winRate,
                    seed: tournamentPlayer.seed,
                    finalPlacement: tournamentPlayer.finalPlacement,
                    status: tournamentPlayer.status
                },
                opponents,
                path: {
                    upper: upperBracketPath.sort((a, b) => a.round - b.round),
                    lower: lowerBracketPath.sort((a, b) => a.round - b.round)
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
