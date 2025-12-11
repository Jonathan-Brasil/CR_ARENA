import { Player, Tournament, Match } from '../../config/associations.js';
import { Op, Sequelize } from 'sequelize';

// Controller: Statistics
export const StatsController = {
    // GET /api/stats - Estatísticas do dashboard
    async getDashboardStats(req, res, next) {
        try {
            const activeTournaments = await Tournament.count({
                where: { status: 'active' }
            });

            const upcomingTournaments = await Tournament.count({
                where: { status: 'upcoming' }
            });

            const totalPlayers = await Player.count();

            // Partidas de hoje
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const matchesToday = await Match.count({
                where: {
                    completedAt: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    }
                }
            });

            res.json({
                activeTournaments,
                upcomingTournaments,
                totalPlayers,
                matchesToday
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/statistics - Estatísticas globais completas
    async getGlobalStats(req, res, next) {
        try {
            const totalTournaments = await Tournament.count();
            const totalMatches = await Match.count({ where: { winnerId: { [Op.ne]: null } } });
            const totalPlayers = await Player.count();

            const avgMatchesPerTournament = totalTournaments > 0
                ? Math.round(totalMatches / totalTournaments)
                : 0;

            // Top jogadores por win rate (mínimo 2 partidas)
            const topPlayers = await Player.findAll({
                where: {
                    [Op.or]: [
                        { wins: { [Op.gt]: 0 } },
                        { losses: { [Op.gt]: 0 } }
                    ]
                },
                order: [
                    [Sequelize.literal('CASE WHEN (wins + losses) > 0 THEN (wins * 100.0 / (wins + losses)) ELSE 0 END'), 'DESC'],
                    ['wins', 'DESC']
                ],
                limit: 10
            });

            // Partidas recentes
            const recentMatches = await Match.findAll({
                where: { winnerId: { [Op.ne]: null } },
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Tournament, as: 'tournament', attributes: ['id', 'name'] }
                ],
                order: [['completedAt', 'DESC']],
                limit: 10
            });

            // Formatar partidas recentes
            const formattedMatches = recentMatches.map(m => ({
                id: m.id,
                tournamentName: m.tournament?.name || 'Torneio',
                bracketType: m.bracketType,
                player1: m.player1,
                player2: m.player2,
                player1Id: m.player1Id,
                player2Id: m.player2Id,
                player1Score: m.player1Score,
                player2Score: m.player2Score,
                winnerId: m.winnerId,
                completedAt: m.completedAt
            }));

            res.json({
                global: {
                    totalTournaments,
                    totalMatches,
                    totalPlayers,
                    avgMatchesPerTournament
                },
                topPlayers,
                recentMatches: formattedMatches
            });
        } catch (error) {
            next(error);
        }
    }
};
