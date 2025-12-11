import { DataTypes } from 'sequelize';
import { conn } from '../../config/sequelize.js';

// Model: Partida (Match)
// Rastreia cada partida do torneio com posição no chaveamento
const Match = conn.define('Match', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tournamentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tournaments',
            key: 'id'
        }
    },
    // Tipo de bracket: upper (vencedores), lower (perdedores), grand_final
    bracketType: {
        type: DataTypes.ENUM('upper', 'lower', 'grand_final'),
        allowNull: false
    },
    // Round dentro do bracket (1, 2, 3...)
    round: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    // Posição da partida no round (para ordenação visual)
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    // Jogadores
    player1Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    player2Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // Pontuação de cada jogador (número de vitórias no MDX)
    player1Score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    player2Score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Vencedor da partida
    winnerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // Perdedor da partida (importante para movimentação no Lower Bracket)
    loserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // ID da próxima partida para o vencedor
    nextMatchId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // ID da próxima partida para o perdedor (Lower Bracket)
    loserNextMatchId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Data agendada da partida
    scheduledDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Data em que a partida foi concluída
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'matches',
    timestamps: true
});

export default Match;
