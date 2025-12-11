import { Friendly, Player } from '../../config/associations.js';
import { Op } from 'sequelize';

// Controller: Friendly (Amistoso)
export const FriendlyController = {
    // GET /api/friendlies - Listar todos os amistosos
    async findAll(req, res, next) {
        try {
            const { status, playerId } = req.query;
            const where = {};

            if (status) {
                where.status = status;
            }

            if (playerId) {
                where[Op.or] = [
                    { player1Id: playerId },
                    { player2Id: playerId }
                ];
            }

            const friendlies = await Friendly.findAll({
                where,
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag', 'clan'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag', 'clan'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json(friendlies);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/friendlies/:id - Buscar amistoso por ID
    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const friendly = await Friendly.findByPk(id, {
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag', 'clan', 'trophies'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag', 'clan', 'trophies'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ]
            });

            if (!friendly) {
                return res.status(404).json({ message: 'Amistoso não encontrado' });
            }

            res.json(friendly);
        } catch (error) {
            next(error);
        }
    },

    // POST /api/friendlies - Criar novo amistoso
    async create(req, res, next) {
        try {
            const { player1Id, player2Id, matchFormat, notes } = req.body;

            // Validar que os dois jogadores são diferentes
            if (player1Id === player2Id) {
                return res.status(400).json({ message: 'Os jogadores devem ser diferentes' });
            }

            // Validar que os jogadores existem
            const player1 = await Player.findByPk(player1Id);
            const player2 = await Player.findByPk(player2Id);

            if (!player1 || !player2) {
                return res.status(400).json({ message: 'Jogador(es) não encontrado(s)' });
            }

            // Validar formato
            const validFormats = ['MD3', 'MD5', 'MD7'];
            if (matchFormat && !validFormats.includes(matchFormat)) {
                return res.status(400).json({ message: 'Formato inválido. Use MD3, MD5 ou MD7' });
            }

            const friendly = await Friendly.create({
                player1Id,
                player2Id,
                matchFormat: matchFormat || 'MD3',
                notes,
                status: 'pending'
            });

            // Recarregar com associações
            const created = await Friendly.findByPk(friendly.id, {
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] }
                ]
            });

            res.status(201).json(created);
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/friendlies/:id/result - Registrar resultado do amistoso
    async updateResult(req, res, next) {
        try {
            const { id } = req.params;
            const { player1Score, player2Score } = req.body;

            const friendly = await Friendly.findByPk(id, {
                include: [
                    { model: Player, as: 'player1' },
                    { model: Player, as: 'player2' }
                ]
            });

            if (!friendly) {
                return res.status(404).json({ message: 'Amistoso não encontrado' });
            }

            if (friendly.status === 'completed') {
                return res.status(400).json({ message: 'Amistoso já finalizado' });
            }

            // Calcular vitórias necessárias baseado no formato
            const winsRequired = friendly.matchFormat === 'MD5' ? 3 :
                friendly.matchFormat === 'MD7' ? 4 : 2;

            // Validar que um dos jogadores atingiu as vitórias necessárias
            if (player1Score < winsRequired && player2Score < winsRequired) {
                return res.status(400).json({
                    message: `Um jogador precisa de ${winsRequired} vitórias no formato ${friendly.matchFormat}`
                });
            }

            // Validar que ninguém excedeu o limite
            if (player1Score > winsRequired || player2Score > winsRequired) {
                return res.status(400).json({
                    message: `Pontuação máxima é ${winsRequired} no formato ${friendly.matchFormat}`
                });
            }

            // Determinar vencedor
            const winnerId = player1Score >= winsRequired ? friendly.player1Id : friendly.player2Id;
            const loserId = winnerId === friendly.player1Id ? friendly.player2Id : friendly.player1Id;

            // Atualizar amistoso
            await friendly.update({
                player1Score,
                player2Score,
                winnerId,
                status: 'completed',
                completedAt: new Date()
            });

            // Atualizar estatísticas dos jogadores
            await Player.increment('wins', { where: { id: winnerId } });
            await Player.increment('losses', { where: { id: loserId } });

            // Recarregar com associações
            const updated = await Friendly.findByPk(id, {
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag', 'wins', 'losses'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag', 'wins', 'losses'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ]
            });

            res.json(updated);
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/friendlies/:id - Deletar amistoso
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            const friendly = await Friendly.findByPk(id);
            if (!friendly) {
                return res.status(404).json({ message: 'Amistoso não encontrado' });
            }

            // Se já foi completado, reverter estatísticas
            if (friendly.status === 'completed' && friendly.winnerId) {
                const loserId = friendly.winnerId === friendly.player1Id
                    ? friendly.player2Id
                    : friendly.player1Id;

                await Player.decrement('wins', { where: { id: friendly.winnerId } });
                await Player.decrement('losses', { where: { id: loserId } });
            }

            await friendly.destroy();
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    // GET /api/friendlies/player/:playerId - Listar amistosos de um jogador
    async getPlayerFriendlies(req, res, next) {
        try {
            const { playerId } = req.params;

            const friendlies = await Friendly.findAll({
                where: {
                    [Op.or]: [
                        { player1Id: playerId },
                        { player2Id: playerId }
                    ],
                    status: 'completed'
                },
                include: [
                    { model: Player, as: 'player1', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'player2', attributes: ['id', 'nickname', 'tag'] },
                    { model: Player, as: 'winner', attributes: ['id', 'nickname'] }
                ],
                order: [['completedAt', 'DESC']]
            });

            res.json(friendlies);
        } catch (error) {
            next(error);
        }
    }
};
