import { DataTypes } from 'sequelize';
import { conn } from '../../config/sequelize.js';

// Model: Jogador (Player)
const Player = conn.define('Player', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nickname: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nickname é obrigatório' },
            len: {
                args: [2, 100],
                msg: 'Nickname deve ter entre 2 e 100 caracteres'
            }
        }
    },
    tag: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Tag é obrigatória' }
        }
    },
    clan: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    trophies: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'players',
    timestamps: true
});

export default Player;
