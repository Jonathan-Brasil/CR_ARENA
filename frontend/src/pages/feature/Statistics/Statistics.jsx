import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Statistics.css';

const API_URL = 'http://localhost:3001';

function Statistics() {
    const [loading, setLoading] = useState(true);
    const [topPlayers, setTopPlayers] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [globalStats, setGlobalStats] = useState({
        totalTournaments: 0,
        totalMatches: 0,
        totalPlayers: 0,
        avgMatchesPerTournament: 0
    });

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            // Fetch global stats
            const statsRes = await fetch(`${API_URL}/api/statistics`);
            if (statsRes.ok) {
                const data = await statsRes.json();
                setGlobalStats(data.global || globalStats);
                setTopPlayers(data.topPlayers || []);
                setRecentMatches(data.recentMatches || []);
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateWinRate = (wins, losses) => {
        const total = wins + losses;
        if (total === 0) return 0;
        return Math.round((wins / total) * 100);
    };

    if (loading) {
        return (
            <div className="statistics-page loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="statistics-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-title-icon">📊</span>
                    Estatísticas
                </h1>
                <p className="page-subtitle">Visão geral de desempenho e rankings</p>
            </div>

            {/* Global Stats */}
            <section className="stats-overview">
                <div className="stat-card">
                    <div className="stat-icon gold">🏆</div>
                    <div className="stat-content">
                        <span className="stat-value">{globalStats.totalTournaments}</span>
                        <span className="stat-label">Torneios Realizados</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">⚔️</div>
                    <div className="stat-content">
                        <span className="stat-value">{globalStats.totalMatches}</span>
                        <span className="stat-label">Partidas Jogadas</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">👥</div>
                    <div className="stat-content">
                        <span className="stat-value">{globalStats.totalPlayers}</span>
                        <span className="stat-label">Jogadores Ativos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">📈</div>
                    <div className="stat-content">
                        <span className="stat-value">{globalStats.avgMatchesPerTournament}</span>
                        <span className="stat-label">Média Partidas/Torneio</span>
                    </div>
                </div>
            </section>

            {/* Top Players */}
            <section className="rankings-section">
                <h2 className="section-title">
                    <span>🏅</span>
                    Top Jogadores por Win Rate
                </h2>

                {topPlayers.length > 0 ? (
                    <div className="rankings-table">
                        <div className="table-header">
                            <span className="col-rank">#</span>
                            <span className="col-player">Jogador</span>
                            <span className="col-wins">Vitórias</span>
                            <span className="col-losses">Derrotas</span>
                            <span className="col-winrate">Win Rate</span>
                        </div>
                        {topPlayers.map((player, index) => (
                            <Link
                                key={player.id}
                                to={`/jogadores/${player.id}`}
                                className="table-row"
                            >
                                <span className={`col-rank rank-${index + 1}`}>
                                    {index + 1 <= 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                </span>
                                <span className="col-player">
                                    <span className="player-avatar">👤</span>
                                    <span className="player-info">
                                        <span className="player-name">{player.nickname}</span>
                                        <span className="player-tag">#{player.tag}</span>
                                    </span>
                                </span>
                                <span className="col-wins text-green">{player.wins || 0}</span>
                                <span className="col-losses text-red">{player.losses || 0}</span>
                                <span className={`col-winrate ${calculateWinRate(player.wins, player.losses) >= 50 ? 'text-green' : 'text-red'}`}>
                                    {calculateWinRate(player.wins || 0, player.losses || 0)}%
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Nenhum jogador com partidas registradas</p>
                    </div>
                )}
            </section>

            {/* Recent Matches */}
            <section className="recent-section">
                <h2 className="section-title">
                    <span>⚔️</span>
                    Partidas Recentes
                </h2>

                {recentMatches.length > 0 ? (
                    <div className="matches-list">
                        {recentMatches.map(match => (
                            <div key={match.id} className="match-item">
                                <div className="match-info">
                                    <span className="tournament-name">{match.tournamentName}</span>
                                    <span className="match-round">{match.bracketType === 'upper' ? 'Upper' : match.bracketType === 'lower' ? 'Lower' : 'Grand Final'}</span>
                                </div>
                                <div className="match-players">
                                    <span className={`player ${match.winnerId === match.player1Id ? 'winner' : ''}`}>
                                        {match.player1?.nickname || 'TBD'}
                                    </span>
                                    <span className="score">
                                        {match.player1Score} - {match.player2Score}
                                    </span>
                                    <span className={`player ${match.winnerId === match.player2Id ? 'winner' : ''}`}>
                                        {match.player2?.nickname || 'TBD'}
                                    </span>
                                </div>
                                <span className="match-date">
                                    {match.completedAt ? new Date(match.completedAt).toLocaleDateString('pt-BR') : '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Nenhuma partida registrada ainda</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Statistics;
