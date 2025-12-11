import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { conn } from "./config/sequelize.js";

// Importar associações (isso configura os relacionamentos)
import './config/associations.js';

// Importar as rotas
import playerRoutes from './feature/player/Player.routes.js';
import tournamentRoutes from './feature/tournament/Tournament.routes.js';
import matchRoutes from './feature/match/Match.routes.js';
import statsRoutes from './feature/stats/Stats.routes.js';
import statisticsRoutes from './feature/statistics/Statistics.routes.js';
import friendlyRoutes from './feature/friendly/Friendly.routes.js';

const app = express();

// Sincronizar banco de dados
conn.sync({ alter: false }).then(() => {
    console.log('📦 Banco de dados sincronizado');
}).catch(err => {
    console.error('❌ Erro ao sincronizar banco:', err);
});

// Middlewares
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CR Arena API is running' });
});

// Registrar rotas
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/friendlies', friendlyRoutes);

// Rota 404
app.use((request, response) => {
    response.status(404).json({ message: "Rota não encontrada!" });
});

// Error handler
app.use(errorHandler);

export default app;