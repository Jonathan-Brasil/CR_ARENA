import { DataTypes } from 'sequelize';
import { conn } from '../../config/sequelize.js';

// Model: Amistoso (Friendly Match)
// Partidas entre dois jogadores fora de torneios
const Friendly = conn.define('Friendly', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Jogador 1
    player1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // Jogador 2
    player2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // Formato da série: MD3, MD5 ou MD7
    matchFormat: {
        type: DataTypes.ENUM('MD3', 'MD5', 'MD7'),
        allowNull: false,
        defaultValue: 'MD3'
    },
    // Pontuação (número de partidas vencidas)
    player1Score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    player2Score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    // Vencedor da série
    winnerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // Status: pending (aguardando resultado) ou completed (finalizado)
    status: {
        type: DataTypes.ENUM('pending', 'completed'),
        defaultValue: 'pending'
    },
    // Data em que o amistoso foi concluído
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Observações/notas sobre o amistoso
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'friendlies',
    timestamps: true
});

export default Friendly;
