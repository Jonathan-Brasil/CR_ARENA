import { DataTypes } from 'sequelize';
import { conn } from '../../config/sequelize.js';

// Model: Torneio (Tournament)
const Tournament = conn.define('Tournament', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nome do torneio é obrigatório' },
            len: {
                args: [3, 200],
                msg: 'Nome deve ter entre 3 e 200 caracteres'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Data de início é obrigatória' },
            isDate: { msg: 'Data inválida' }
        }
    },
    status: {
        type: DataTypes.ENUM('upcoming', 'active', 'finished'),
        defaultValue: 'upcoming'
    },
    // Formato de Partida: MD3 (Melhor de 3), MD5 (Melhor de 5), MD7 (Melhor de 7)
    matchFormat: {
        type: DataTypes.ENUM('MD3', 'MD5', 'MD7'),
        defaultValue: 'MD3'
    },
    // Número máximo de jogadores (deve ser potência de 2: 4, 8, 16, 32)
    maxPlayers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 8,
        validate: {
            isIn: {
                args: [[4, 8, 16, 32]],
                msg: 'Número de jogadores deve ser 4, 8, 16 ou 32'
            }
        }
    },
    // Número atual de jogadores inscritos
    currentPlayers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // ID do campeão (preenchido ao finalizar)
    winnerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'players',
            key: 'id'
        }
    }
}, {
    tableName: 'tournaments',
    timestamps: true
});

export default Tournament;
