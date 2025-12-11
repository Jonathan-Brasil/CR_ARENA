// Associações entre os Models
import Player from '../feature/player/Player.model.js';
import Tournament from '../feature/tournament/Tournament.model.js';
import TournamentPlayer from '../feature/tournament/TournamentPlayer.model.js';
import Match from '../feature/match/Match.model.js';
import Friendly from '../feature/friendly/Friendly.model.js';

// Player <-> Tournament (N:N através de TournamentPlayer)
Player.belongsToMany(Tournament, {
    through: TournamentPlayer,
    foreignKey: 'playerId',
    otherKey: 'tournamentId',
    as: 'tournaments'
});

Tournament.belongsToMany(Player, {
    through: TournamentPlayer,
    foreignKey: 'tournamentId',
    otherKey: 'playerId',
    as: 'players'
});

// TournamentPlayer associations
TournamentPlayer.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });
TournamentPlayer.belongsTo(Tournament, { foreignKey: 'tournamentId', as: 'tournament' });

// Tournament -> Winner
Tournament.belongsTo(Player, { foreignKey: 'winnerId', as: 'winner' });

// Match associations
Match.belongsTo(Tournament, { foreignKey: 'tournamentId', as: 'tournament' });
Match.belongsTo(Player, { foreignKey: 'player1Id', as: 'player1' });
Match.belongsTo(Player, { foreignKey: 'player2Id', as: 'player2' });
Match.belongsTo(Player, { foreignKey: 'winnerId', as: 'winner' });
Match.belongsTo(Player, { foreignKey: 'loserId', as: 'loser' });

// Tournament -> Matches
Tournament.hasMany(Match, { foreignKey: 'tournamentId', as: 'matches' });

// Player -> Matches (como jogador 1 ou 2)
Player.hasMany(Match, { foreignKey: 'player1Id', as: 'matchesAsPlayer1' });
Player.hasMany(Match, { foreignKey: 'player2Id', as: 'matchesAsPlayer2' });

// ================================
// FRIENDLY (Amistoso) associations
// ================================
Friendly.belongsTo(Player, { foreignKey: 'player1Id', as: 'player1' });
Friendly.belongsTo(Player, { foreignKey: 'player2Id', as: 'player2' });
Friendly.belongsTo(Player, { foreignKey: 'winnerId', as: 'winner' });

// Player -> Friendlies
Player.hasMany(Friendly, { foreignKey: 'player1Id', as: 'friendliesAsPlayer1' });
Player.hasMany(Friendly, { foreignKey: 'player2Id', as: 'friendliesAsPlayer2' });

export { Player, Tournament, TournamentPlayer, Match, Friendly };
