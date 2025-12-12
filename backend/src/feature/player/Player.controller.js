import { Player, Match, Tournament, TournamentPlayer, Friendly } from '../../config/associations.js';
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
    },

    // GET /api/players/:id/title - Calcular título do jogador
    async getTitle(req, res, next) {
        try {
            const { id } = req.params;

            // Buscar jogador
            const player = await Player.findByPk(id);
            if (!player) {
                return res.status(404).json({ message: 'Jogador não encontrado' });
            }

            const wins = player.wins || 0;
            const losses = player.losses || 0;
            const total = wins + losses;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

            // Se win rate <= 60%, nenhum título
            if (winRate <= 60) {
                return res.json({ title: null, subtitle: null, tier: null });
            }

            // Buscar todas as partidas completadas do jogador (torneios + amistosos)
            const [matches, friendlies] = await Promise.all([
                Match.findAll({
                    where: {
                        [Op.or]: [
                            { player1Id: id },
                            { player2Id: id }
                        ],
                        winnerId: { [Op.ne]: null }
                    },
                    include: [
                        { model: Player, as: 'player1', attributes: ['id', 'nickname'] },
                        { model: Player, as: 'player2', attributes: ['id', 'nickname'] }
                    ]
                }),
                Friendly.findAll({
                    where: {
                        [Op.or]: [
                            { player1Id: id },
                            { player2Id: id }
                        ],
                        status: 'completed'
                    },
                    include: [
                        { model: Player, as: 'player1', attributes: ['id', 'nickname'] },
                        { model: Player, as: 'player2', attributes: ['id', 'nickname'] }
                    ]
                })
            ]);

            // Calcular estatísticas contra cada oponente
            const opponentStats = {};
            const playerId = parseInt(id);

            // Processar partidas de torneio
            matches.forEach(match => {
                const isPlayer1 = match.player1Id === playerId;
                const opponent = isPlayer1 ? match.player2 : match.player1;
                const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
                const isWin = match.winnerId === playerId;

                if (!opponent) return;

                if (!opponentStats[opponentId]) {
                    opponentStats[opponentId] = {
                        player: opponent,
                        wins: 0,
                        losses: 0,
                        friendlyWins: 0,
                        friendlyLosses: 0
                    };
                }

                if (isWin) {
                    opponentStats[opponentId].wins++;
                } else {
                    opponentStats[opponentId].losses++;
                }
            });

            // Processar amistosos
            friendlies.forEach(friendly => {
                const isPlayer1 = friendly.player1Id === playerId;
                const opponent = isPlayer1 ? friendly.player2 : friendly.player1;
                const opponentId = isPlayer1 ? friendly.player2Id : friendly.player1Id;
                const isWin = friendly.winnerId === playerId;

                if (!opponent) return;

                if (!opponentStats[opponentId]) {
                    opponentStats[opponentId] = {
                        player: opponent,
                        wins: 0,
                        losses: 0,
                        friendlyWins: 0,
                        friendlyLosses: 0
                    };
                }

                if (isWin) {
                    opponentStats[opponentId].friendlyWins++;
                } else {
                    opponentStats[opponentId].friendlyLosses++;
                }
            });

            const opponentsList = Object.values(opponentStats);
            const playersDefeated = opponentsList.filter(o => (o.wins + o.friendlyWins) > 0);
            const allPlayersDefeated = opponentsList.every(o => (o.wins + o.friendlyWins) > (o.losses + o.friendlyLosses));

            // Verificar "Pai de X" - domínio em amistosos (3+ vitórias contra mesmo jogador em amistosos)
            const dominatedInFriendly = opponentsList.find(o => o.friendlyWins >= 3 && o.friendlyWins > o.friendlyLosses);

            // Verificar vitórias consecutivas (para Mini-Chefe do Lobby)
            // Ordenar partidas por data para verificar consecutivas
            const allGames = [
                ...matches.map(m => ({
                    winnerId: m.winnerId,
                    opponentId: m.player1Id === playerId ? m.player2Id : m.player1Id,
                    completedAt: m.completedAt
                })),
                ...friendlies.map(f => ({
                    winnerId: f.winnerId,
                    opponentId: f.player1Id === playerId ? f.player2Id : f.player1Id,
                    completedAt: f.completedAt
                }))
            ].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

            let consecutiveWins = 0;
            let maxConsecutiveWins = 0;
            let consecutiveOpponents = new Set();
            let hasConsecutiveWinsAgainstDifferentPlayers = false;

            for (const game of allGames) {
                if (game.winnerId === playerId) {
                    consecutiveWins++;
                    consecutiveOpponents.add(game.opponentId);
                    if (consecutiveWins >= 2 && consecutiveOpponents.size >= 2) {
                        hasConsecutiveWinsAgainstDifferentPlayers = true;
                    }
                    maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
                } else {
                    consecutiveWins = 0;
                    consecutiveOpponents.clear();
                }
            }

            // Determinar título baseado na prioridade
            let title = null;
            let subtitle = null;
            let tier = null;
            let emoji = null;

            // 8. "Pai de [Nome]" - Vitórias em amistosos (verificar primeiro como caso especial)
            if (dominatedInFriendly) {
                const childName = dominatedInFriendly.player.nickname;
                title = `Pai de ${childName}`;
                subtitle = 'Domínio em Amistosos';
                tier = 'daddy';
                emoji = '👨';
            }

            // 1. ODIN – O Todo-Poderoso (maior prioridade depois do Pai)
            if (!title && allPlayersDefeated && playersDefeated.length > 0 && wins > losses) {
                title = 'ODIN';
                subtitle = 'O Pai de Todos';
                tier = 'legendary';
                emoji = '⚡';
            }

            // 2. MR. CATRA – Dono do Lobby
            if (!title && playersDefeated.length >= 4 && wins > losses) {
                title = 'MR. CATRA';
                subtitle = 'Dono do Lobby';
                tier = 'mythic';
                emoji = '👑';
            }

            // 3. "A Lenda do CMR" – Intocável
            if (!title && winRate >= 80) {
                title = 'A Lenda do CMR';
                subtitle = 'Intocável';
                tier = 'legendary';
                emoji = '🏆';
            }

            // 4. "Modo Tryhard" – Frio e Calculista
            if (!title && winRate >= 70) {
                title = 'Modo Tryhard';
                subtitle = 'Frio e Calculista';
                tier = 'epic';
                emoji = '🎯';
            }

            // 5. "Carregador Profissional" – Faz o Trabalho Pesado
            if (!title && winRate >= 65 && total > 10) {
                title = 'Carregador Profissional';
                subtitle = 'Faz o Trabalho Pesado';
                tier = 'rare';
                emoji = '💪';
            }

            // 6. "Sortudo do Caramba" – A Fortuna Sorri
            if (!title && winRate >= 60 && total < 5) {
                title = 'Sortudo do Caramba';
                subtitle = 'A Fortuna Sorri';
                tier = 'uncommon';
                emoji = '🍀';
            }

            // 7. "Mini-Chefe do Lobby" – Respeita o Pai
            if (!title && hasConsecutiveWinsAgainstDifferentPlayers) {
                title = 'Mini-Chefe do Lobby';
                subtitle = 'Respeita o Pai';
                tier = 'uncommon';
                emoji = '😤';
            }

            res.json({
                title,
                subtitle,
                tier,
                emoji,
                stats: {
                    winRate,
                    wins,
                    losses,
                    total,
                    uniqueOpponentsDefeated: playersDefeated.length,
                    totalOpponents: opponentsList.length,
                    allDefeated: allPlayersDefeated
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
