import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log('');
    console.log('🏆 ================================ 🏆');
    console.log('   CR ARENA - Tournament Platform');
    console.log('🏆 ================================ 🏆');
    console.log('');
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log('');
    console.log('📌 Endpoints disponíveis:');
    console.log('   GET  /api/health        - Health check');
    console.log('   GET  /api/players       - Listar jogadores');
    console.log('   POST /api/players       - Criar jogador');
    console.log('   GET  /api/tournaments   - Listar torneios');
    console.log('   POST /api/tournaments   - Criar torneio');
    console.log('   GET  /api/matches       - Listar partidas');
    console.log('   PUT  /api/matches/:id/result - Registrar resultado');
    console.log('');
});