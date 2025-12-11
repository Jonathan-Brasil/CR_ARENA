import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import './PlayerDetails.css';

const API_URL = 'http://localhost:3001';

function PlayerDetails() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const tournamentIdFromUrl = searchParams.get('tournamentId');

    const [player, setPlayer] = useState(null);
    const [matchHistory, setMatchHistory] = useState([]);
    const [friendlyHistory, setFriendlyHistory] = useState([]);
    const [playerTournaments, setPlayerTournaments] = useState([]);
    const [tournamentStats, setTournamentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeHistoryTab, setActiveHistoryTab] = useState('all');
    const [selectedTournamentId, setSelectedTournamentId] = useState(tournamentIdFromUrl || '');
    const [statsMode, setStatsMode] = useState(tournamentIdFromUrl ? 'tournament' : 'global');

    useEffect(() => {
        fetchPlayerData();
    }, [id]);

    useEffect(() => {
        if (selectedTournamentId && statsMode === 'tournament') {
            fetchTournamentStats();
        } else {
            setTournamentStats(null);
        }
    }, [selectedTournamentId, statsMode]);

    const fetchPlayerData = async () => {
        try {
            const [playerRes, historyRes, friendlyRes, tournamentsRes] = await Promise.all([
                fetch(`${API_URL}/api/players/${id}`),
                fetch(`${API_URL}/api/players/${id}/matches`),
                fetch(`${API_URL}/api/friendlies/player/${id}`),
                fetch(`${API_URL}/api/players/${id}/tournaments`)
            ]);

            if (playerRes.ok) {
                const playerData = await playerRes.json();
                setPlayer(playerData);
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setMatchHistory(historyData);
            }

            if (friendlyRes.ok) {
                const friendlyData = await friendlyRes.json();
                setFriendlyHistory(friendlyData);
            }

            if (tournamentsRes.ok) {
                const tournamentsData = await tournamentsRes.json();
                setPlayerTournaments(tournamentsData);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do jogador:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTournamentStats = async () => {
        if (!selectedTournamentId) return;
        try {
            const res = await fetch(`${API_URL}/api/players/${id}/stats/${selectedTournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setTournamentStats(data);
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas do torneio:', error);
        }
    };

    const calculateWinRate = (wins, losses) => {
        const total = wins + losses;
        if (total === 0) return 0;
        return Math.round((wins / total) * 100);
    };

    const getDisplayedStats = () => {
        if (statsMode === 'tournament' && tournamentStats) {
            return {
                wins: tournamentStats.stats.wins,
                losses: tournamentStats.stats.losses,
                winRate: tournamentStats.stats.winRate,
                total: tournamentStats.stats.wins + tournamentStats.stats.losses
            };
        }
        return {
            wins: player?.wins || 0,
            losses: player?.losses || 0,
            winRate: calculateWinRate(player?.wins || 0, player?.losses || 0),
            total: (player?.wins || 0) + (player?.losses || 0)
        };
    };

    const getOpponentStats = () => {
        const winsAgainst = {};
        const lossesAgainst = {};

        // Filter matches based on mode
        const matchesToProcess = statsMode === 'tournament' && selectedTournamentId
            ? matchHistory.filter(m => m.tournamentId === parseInt(selectedTournamentId))
            : matchHistory;

        matchesToProcess.forEach(match => {
            const isPlayer1 = match.player1Id === parseInt(id);
            const opponent = isPlayer1 ? match.player2 : match.player1;
            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            const isWin = match.winnerId === parseInt(id);

            if (!opponent) return;

            if (isWin) {
                if (!winsAgainst[opponentId]) {
                    winsAgainst[opponentId] = { player: opponent, count: 0 };
                }
                winsAgainst[opponentId].count++;
            } else if (match.winnerId) {
                if (!lossesAgainst[opponentId]) {
                    lossesAgainst[opponentId] = { player: opponent, count: 0 };
                }
                lossesAgainst[opponentId].count++;
            }
        });

        // Include friendlies only in global mode
        if (statsMode === 'global') {
            friendlyHistory.forEach(friendly => {
                const isPlayer1 = friendly.player1Id === parseInt(id);
                const opponent = isPlayer1 ? friendly.player2 : friendly.player1;
                const opponentId = isPlayer1 ? friendly.player2Id : friendly.player1Id;
                const isWin = friendly.winnerId === parseInt(id);

                if (!opponent) return;

                if (isWin) {
                    if (!winsAgainst[opponentId]) {
                        winsAgainst[opponentId] = { player: opponent, count: 0 };
                    }
                    winsAgainst[opponentId].count++;
                } else if (friendly.winnerId) {
                    if (!lossesAgainst[opponentId]) {
                        lossesAgainst[opponentId] = { player: opponent, count: 0 };
                    }
                    lossesAgainst[opponentId].count++;
                }
            });
        }

        return {
            wins: Object.values(winsAgainst).sort((a, b) => b.count - a.count),
            losses: Object.values(lossesAgainst).sort((a, b) => b.count - a.count)
        };
    };

    const getFilteredHistory = () => {
        let matches = matchHistory;
        let friendlies = friendlyHistory;

        // Filter by tournament if in tournament mode
        if (statsMode === 'tournament' && selectedTournamentId) {
            matches = matchHistory.filter(m => m.tournamentId === parseInt(selectedTournamentId));
            friendlies = []; // No friendlies in tournament mode
        }

        // Filter by tab
        if (activeHistoryTab === 'tournament') {
            return { matches, friendlies: [] };
        }
        if (activeHistoryTab === 'friendly') {
            return { matches: [], friendlies };
        }
        return { matches, friendlies };
    };

    if (loading) {
        return (
            <div className="player-details-page loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="player-details-page error">
                <p>Jogador não encontrado</p>
                <Link to="/jogadores" className="btn btn-primary">Voltar aos Jogadores</Link>
            </div>
        );
    }

    const opponentStats = getOpponentStats();
    const displayedStats = getDisplayedStats();
    const { matches, friendlies } = getFilteredHistory();

    return (
        <div className="player-details-page animate-fade-in">
            <div className="page-nav">
                <Link to="/jogadores" className="back-link">
                    <span>←</span>
                    <span>Voltar</span>
                </Link>
            </div>

            {/* Stats Mode Selector */}
            <div className="stats-mode-selector">
                <button
                    className={`mode-btn ${statsMode === 'global' ? 'active' : ''}`}
                    onClick={() => setStatsMode('global')}
                >
                    📊 Estatísticas Gerais
                </button>
                <button
                    className={`mode-btn ${statsMode === 'tournament' ? 'active' : ''}`}
                    onClick={() => setStatsMode('tournament')}
                >
                    🏆 Por Torneio
                </button>

                {statsMode === 'tournament' && (
                    <select
                        className="tournament-select"
                        value={selectedTournamentId}
                        onChange={(e) => setSelectedTournamentId(e.target.value)}
                    >
                        <option value="">Selecione um torneio</option>
                        {playerTournaments.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} ({t.status})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Player Header */}
            <div className="player-header">
                <div className="player-profile-section">
                    <div className="player-main">
                        <div className="player-avatar-large">
                            <span>👤</span>
                            {player.trophies >= 7000 && <span className="trophy-badge">🏅</span>}
                        </div>
                        <div className="player-info">
                            <h1 className="player-name">{player.nickname}</h1>
                            <span className="player-tag">#{player.tag}</span>
                            {player.clan && (
                                <span className="player-clan">
                                    <span>🛡️</span>
                                    {player.clan}
                                </span>
                            )}
                        </div>
                        {player.trophies > 0 && (
                            <div className="player-trophies">
                                <span className="trophies-icon">🏆</span>
                                <span className="trophies-value">{player.trophies?.toLocaleString()}</span>
                                <span className="trophies-label">Troféus</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tournament Info Banner */}
                {statsMode === 'tournament' && tournamentStats && (
                    <div className="tournament-banner">
                        <span className="tournament-banner-icon">🏆</span>
                        <span className="tournament-banner-text">
                            Estatísticas de: <strong>{tournamentStats.tournament.name}</strong>
                        </span>
                        <span className={`tournament-status ${tournamentStats.stats.status}`}>
                            {tournamentStats.stats.status === 'active' ? 'Ativo' :
                                tournamentStats.stats.status === 'eliminated' ? 'Eliminado' : 'Campeão'}
                        </span>
                    </div>
                )}

                <div className='status-player'>
                    <div className="player-stats-grid">
                        <div className="stat-box wins">
                            <span className="stat-icon">✅</span>
                            <span className="stat-value">{displayedStats.wins}</span>
                            <span className="stat-label">Vitórias</span>
                        </div>
                        <div className="stat-box losses">
                            <span className="stat-icon">❌</span>
                            <span className="stat-value">{displayedStats.losses}</span>
                            <span className="stat-label">Derrotas</span>
                        </div>
                        <div className="stat-box winrate">
                            <span className="stat-icon">📊</span>
                            <span className={`stat-value ${displayedStats.winRate >= 50 ? 'text-green' : displayedStats.winRate > 0 ? 'text-red' : ''}`}>
                                {displayedStats.winRate}%
                            </span>
                            <span className="stat-label">Win Rate</span>
                        </div>
                        <div className="stat-box matches">
                            <span className="stat-icon">⚔️</span>
                            <span className="stat-value">{displayedStats.total}</span>
                            <span className="stat-label">Total Partidas</span>
                        </div>
                    </div>

                    {/* Stats Breakdown - only in global mode */}
                    {statsMode === 'global' && (
                        <div className="stats-breakdown">
                            <div className="breakdown-item">
                                <span className="breakdown-icon">🏆</span>
                                <span className="breakdown-label">Torneios</span>
                                <span className="breakdown-value">
                                    {matchHistory.filter(m => m.winnerId === parseInt(id)).length} V /
                                    {matchHistory.filter(m => m.winnerId && m.winnerId !== parseInt(id)).length} D
                                </span>
                            </div>
                            <div className="breakdown-item">
                                <span className="breakdown-icon">🤝</span>
                                <span className="breakdown-label">Amistosos</span>
                                <span className="breakdown-value">
                                    {friendlyHistory.filter(f => f.winnerId === parseInt(id)).length} V /
                                    {friendlyHistory.filter(f => f.winnerId && f.winnerId !== parseInt(id)).length} D
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Tournament Path - only in tournament mode */}
                    {statsMode === 'tournament' && tournamentStats && (
                        <div className="tournament-path">
                            <h3 className="path-title">📍 Caminho no Torneio</h3>
                            <div className="path-brackets">
                                {tournamentStats.path.upper.length > 0 && (
                                    <div className="path-bracket upper">
                                        <h4>Upper Bracket</h4>
                                        <div className="path-rounds">
                                            {tournamentStats.path.upper.map((p, i) => (
                                                <div key={i} className={`path-round ${p.result === 'V' ? 'win' : p.result === 'D' ? 'loss' : ''}`}>
                                                    <span className="round-number">R{p.round}</span>
                                                    <span className="round-opponent">vs {p.opponent}</span>
                                                    <span className="round-result">{p.result}</span>
                                                    <span className="round-score">{p.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {tournamentStats.path.lower.length > 0 && (
                                    <div className="path-bracket lower">
                                        <h4>Lower Bracket</h4>
                                        <div className="path-rounds">
                                            {tournamentStats.path.lower.map((p, i) => (
                                                <div key={i} className={`path-round ${p.result === 'V' ? 'win' : p.result === 'D' ? 'loss' : ''}`}>
                                                    <span className="round-number">R{p.round}</span>
                                                    <span className="round-opponent">vs {p.opponent}</span>
                                                    <span className="round-result">{p.result}</span>
                                                    <span className="round-score">{p.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confrontos */}
            <div className="confrontos-section">
                <div className="confronto-column">
                    <h2 className="confronto-title wins-title">
                        <span>✅</span>
                        Vitórias Contra
                    </h2>
                    {opponentStats.wins.length > 0 ? (
                        <div className="confronto-list">
                            {opponentStats.wins.map(({ player: opponent, count }) => (
                                <Link
                                    key={opponent.id}
                                    to={`/jogadores/${opponent.id}`}
                                    className="confronto-item"
                                >
                                    <span className="opponent-avatar">👤</span>
                                    <span className="opponent-info">
                                        <span className="opponent-name">{opponent.nickname}</span>
                                        <span className="opponent-tag">#{opponent.tag}</span>
                                    </span>
                                    <span className="confronto-count text-green">
                                        {count}x
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-confronto">
                            <p>Nenhuma vitória registrada</p>
                        </div>
                    )}
                </div>

                <div className="confronto-column">
                    <h2 className="confronto-title losses-title">
                        <span>❌</span>
                        Derrotas Para
                    </h2>
                    {opponentStats.losses.length > 0 ? (
                        <div className="confronto-list">
                            {opponentStats.losses.map(({ player: opponent, count }) => (
                                <Link
                                    key={opponent.id}
                                    to={`/jogadores/${opponent.id}`}
                                    className="confronto-item"
                                >
                                    <span className="opponent-avatar">👤</span>
                                    <span className="opponent-info">
                                        <span className="opponent-name">{opponent.nickname}</span>
                                        <span className="opponent-tag">#{opponent.tag}</span>
                                    </span>
                                    <span className="confronto-count text-red">
                                        {count}x
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-confronto">
                            <p>Nenhuma derrota registrada</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Match History with Tabs */}
            <section className="history-section">
                <div className="history-header">
                    <h2 className="section-title">
                        <span>📋</span>
                        Histórico de Partidas
                    </h2>
                    {statsMode === 'global' && (
                        <div className="history-tabs">
                            <button
                                className={`history-tab ${activeHistoryTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('all')}
                            >
                                Todas ({matchHistory.length + friendlyHistory.length})
                            </button>
                            <button
                                className={`history-tab ${activeHistoryTab === 'tournament' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('tournament')}
                            >
                                🏆 Torneios ({matchHistory.length})
                            </button>
                            <button
                                className={`history-tab ${activeHistoryTab === 'friendly' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('friendly')}
                            >
                                🤝 Amistosos ({friendlyHistory.length})
                            </button>
                        </div>
                    )}
                </div>

                {(matches.length > 0 || friendlies.length > 0) ? (
                    <div className="history-list">
                        {/* Tournament Matches */}
                        {matches.map(match => {
                            const isPlayer1 = match.player1Id === parseInt(id);
                            const opponent = isPlayer1 ? match.player2 : match.player1;
                            const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
                            const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
                            const isWin = match.winnerId === parseInt(id);
                            const isComplete = !!match.winnerId;

                            return (
                                <div
                                    key={`match-${match.id}`}
                                    className={`history-item ${isComplete ? (isWin ? 'win' : 'loss') : 'pending'}`}
                                >
                                    <div className="result-indicator">
                                        {isComplete ? (isWin ? 'V' : 'D') : '-'}
                                    </div>
                                    <div className="match-details">
                                        <span className="tournament-name">
                                            🏆 {match.tournament?.name || 'Torneio'}
                                        </span>
                                        <span className="bracket-info">
                                            {match.bracketType === 'upper' ? 'Upper Bracket' :
                                                match.bracketType === 'lower' ? 'Lower Bracket' : 'Grand Final'}
                                            {' • R' + match.round}
                                        </span>
                                    </div>
                                    <div className="opponent-info-section">
                                        <span className="vs-label">vs</span>
                                        <span className="opponent-name">{opponent?.nickname || 'TBD'}</span>
                                    </div>
                                    <div className="score-result">
                                        <span className={isWin ? 'text-green' : 'text-red'}>
                                            {playerScore ?? '-'}
                                        </span>
                                        <span className="score-separator">-</span>
                                        <span className={!isWin && isComplete ? 'text-green' : 'text-red'}>
                                            {opponentScore ?? '-'}
                                        </span>
                                    </div>
                                    <span className="match-date">
                                        {match.completedAt
                                            ? new Date(match.completedAt).toLocaleDateString('pt-BR')
                                            : 'Aguardando'}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Friendly Matches */}
                        {friendlies.map(friendly => {
                            const isPlayer1 = friendly.player1Id === parseInt(id);
                            const opponent = isPlayer1 ? friendly.player2 : friendly.player1;
                            const playerScore = isPlayer1 ? friendly.player1Score : friendly.player2Score;
                            const opponentScore = isPlayer1 ? friendly.player2Score : friendly.player1Score;
                            const isWin = friendly.winnerId === parseInt(id);

                            return (
                                <div
                                    key={`friendly-${friendly.id}`}
                                    className={`history-item ${isWin ? 'win' : 'loss'} friendly-match`}
                                >
                                    <div className="result-indicator">
                                        {isWin ? 'V' : 'D'}
                                    </div>
                                    <div className="match-details">
                                        <span className="tournament-name">
                                            🤝 Amistoso
                                        </span>
                                        <span className="bracket-info">
                                            {friendly.matchFormat}
                                        </span>
                                    </div>
                                    <div className="opponent-info-section">
                                        <span className="vs-label">vs</span>
                                        <span className="opponent-name">{opponent?.nickname || 'TBD'}</span>
                                    </div>
                                    <div className="score-result">
                                        <span className={isWin ? 'text-green' : 'text-red'}>
                                            {playerScore}
                                        </span>
                                        <span className="score-separator">-</span>
                                        <span className={!isWin ? 'text-green' : 'text-red'}>
                                            {opponentScore}
                                        </span>
                                    </div>
                                    <span className="match-date">
                                        {friendly.completedAt
                                            ? new Date(friendly.completedAt).toLocaleDateString('pt-BR')
                                            : '-'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Nenhuma partida registrada</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PlayerDetails;
