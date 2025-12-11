import { DataTypes } from 'sequelize';
import { conn } from '../../config/sequelize.js';

// Model: Inscrição de Jogador no Torneio (TournamentPlayer)
// Tabela de relacionamento N:N entre Torneio e Jogador
const TournamentPlayer = conn.define('TournamentPlayer', {
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
    playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'players',
            key: 'id'
        }
    },
    // Seed do jogador (posição inicial no chaveamento)
    seed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Status do jogador no torneio
    status: {
        type: DataTypes.ENUM('active', 'eliminated', 'winner'),
        defaultValue: 'active'
    },
    // Colocação final (1º, 2º, 3º, etc)
    finalPlacement: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Estatísticas do jogador NESTE torneio
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'tournament_players',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['tournamentId', 'playerId']
        }
    ]
});

export default TournamentPlayer;
