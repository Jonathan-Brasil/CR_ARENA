import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Bracket.css';

const API_URL = 'http://localhost:3001';

function Bracket() {
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [tournamentStats, setTournamentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [scoreModal, setScoreModal] = useState(false);
    const [scores, setScores] = useState({ player1: 0, player2: 0 });
    const [activeTab, setActiveTab] = useState('bracket');

    useEffect(() => {
        fetchTournamentData();
    }, [id]);

    const fetchTournamentData = async () => {
        try {
            const [tournamentRes, matchesRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/tournaments/${id}`),
                fetch(`${API_URL}/api/tournaments/${id}/matches`),
                fetch(`${API_URL}/api/tournaments/${id}/stats`)
            ]);

            if (tournamentRes.ok) {
                const tournamentData = await tournamentRes.json();
                setTournament(tournamentData);
            }

            if (matchesRes.ok) {
                const matchesData = await matchesRes.json();
                setMatches(matchesData);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setTournamentStats(statsData);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do torneio:', error);
        } finally {
            setLoading(false);
        }
    };

    // Organize matches by bracket type and round
    const organizeMatches = useCallback(() => {
        const upperBracket = {};
        const lowerBracket = {};
        let grandFinal = null;

        matches.forEach(match => {
            if (match.bracketType === 'grand_final') {
                grandFinal = match;
            } else if (match.bracketType === 'upper') {
                if (!upperBracket[match.round]) upperBracket[match.round] = [];
                upperBracket[match.round].push(match);
            } else if (match.bracketType === 'lower') {
                if (!lowerBracket[match.round]) lowerBracket[match.round] = [];
                lowerBracket[match.round].push(match);
            }
        });

        // Sort matches within each round by position
        Object.keys(upperBracket).forEach(round => {
            upperBracket[round].sort((a, b) => a.position - b.position);
        });
        Object.keys(lowerBracket).forEach(round => {
            lowerBracket[round].sort((a, b) => a.position - b.position);
        });

        return { upperBracket, lowerBracket, grandFinal };
    }, [matches]);

    const { upperBracket, lowerBracket, grandFinal } = organizeMatches();

    const getWinsRequired = () => {
        if (!tournament) return 2;
        const format = tournament.matchFormat;
        if (format === 'MD5') return 3;
        if (format === 'MD7') return 4;
        return 2; // MD3
    };

    const openScoreModal = (match) => {
        if (!match.player1Id || !match.player2Id) return;
        if (match.winnerId) return; // Already finished

        setSelectedMatch(match);
        setScores({ player1: match.player1Score || 0, player2: match.player2Score || 0 });
        setScoreModal(true);
    };

    const handleScoreChange = (player, value) => {
        const winsRequired = getWinsRequired();
        const newValue = Math.max(0, Math.min(winsRequired, parseInt(value) || 0));
        setScores(prev => ({ ...prev, [player]: newValue }));
    };

    const submitScore = async () => {
        if (!selectedMatch) return;

        const winsRequired = getWinsRequired();

        // Check if we have a winner
        if (scores.player1 < winsRequired && scores.player2 < winsRequired) {
            alert(`Uma das pontuações deve ser ${winsRequired} para determinar o vencedor`);
            return;
        }

        const winnerId = scores.player1 >= winsRequired
            ? selectedMatch.player1Id
            : selectedMatch.player2Id;

        try {
            const response = await fetch(`${API_URL}/api/matches/${selectedMatch.id}/result`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player1Score: scores.player1,
                    player2Score: scores.player2,
                    winnerId
                })
            });

            if (response.ok) {
                setScoreModal(false);
                setSelectedMatch(null);
                fetchTournamentData(); // Refresh data
            }
        } catch (error) {
            console.error('Erro ao atualizar resultado:', error);
        }
    };

    const getRoundName = (round, type) => {
        if (type === 'upper') {
            const upperRounds = Object.keys(upperBracket).length;
            if (round === upperRounds) return 'Upper Final';
            if (round === upperRounds - 1) return 'Upper Semifinals';
            return `Upper Round ${round}`;
        } else {
            const lowerRounds = Object.keys(lowerBracket).length;
            if (round === lowerRounds) return 'Lower Final';
            return `Lower Round ${round}`;
        }
    };

    const renderMatch = (match) => {
        const isPlayable = match.player1Id && match.player2Id && !match.winnerId;
        const isComplete = !!match.winnerId;

        return (
            <div
                key={match.id}
                className={`match-card ${isPlayable ? 'playable' : ''} ${isComplete ? 'complete' : ''}`}
                onClick={() => openScoreModal(match)}
            >
                <div className={`match-player ${match.winnerId === match.player1Id ? 'winner' : ''} ${match.winnerId && match.winnerId !== match.player1Id ? 'loser' : ''}`}>
                    <span className="player-name">
                        {match.player1?.nickname || 'TBD'}
                    </span>
                    <span className="player-score">{match.player1Score ?? '-'}</span>
                </div>
                <div className={`match-player ${match.winnerId === match.player2Id ? 'winner' : ''} ${match.winnerId && match.winnerId !== match.player2Id ? 'loser' : ''}`}>
                    <span className="player-name">
                        {match.player2?.nickname || 'TBD'}
                    </span>
                    <span className="player-score">{match.player2Score ?? '-'}</span>
                </div>
                {match.scheduledDate && (
                    <div className="match-date">
                        {new Date(match.scheduledDate).toLocaleDateString('pt-BR')}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bracket-page loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="bracket-page error">
                <p>Torneio não encontrado</p>
                <Link to="/torneios" className="btn btn-primary">Voltar aos Torneios</Link>
            </div>
        );
    }

    return (
        <div className="bracket-page">
            {/* Header */}
            <div className="bracket-header">
                <div className="header-content">
                    <Link to="/torneios" className="back-link">
                        <span>←</span>
                        <span>Voltar</span>
                    </Link>
                    <div className="tournament-info">
                        <h1 className="tournament-name">{tournament.name}</h1>
                        <div className="tournament-meta">
                            <span className="meta-item">
                                <span>📅</span>
                                {new Date(tournament.startDate).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="meta-item">
                                <span>👥</span>
                                {tournament.currentPlayers || 0} Jogadores
                            </span>
                            <span className="meta-item format">
                                {tournament.matchFormat}
                            </span>
                            {tournamentStats && (
                                <span className="meta-item progress">
                                    📊 {tournamentStats.summary.progress}% completo
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bracket-tabs">
                    <button
                        className={`bracket-tab ${activeTab === 'bracket' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bracket')}
                    >
                        🏆 Chaveamento
                    </button>
                    <button
                        className={`bracket-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        📊 Estatísticas
                    </button>
                </div>
            </div>

            {/* Bracket View */}
            {activeTab === 'bracket' && (
                <div className="bracket-container">
                    {/* Upper Bracket */}
                    <section className="bracket-section upper-bracket">
                        <h2 className="bracket-title upper">
                            <span className="bracket-icon">🏆</span>
                            Upper Bracket
                        </h2>
                        <div className="bracket-rounds">
                            {Object.keys(upperBracket).sort((a, b) => a - b).map(round => (
                                <div key={`upper-${round}`} className="bracket-round">
                                    <h3 className="round-title">{getRoundName(parseInt(round), 'upper')}</h3>
                                    <div className="round-matches">
                                        {upperBracket[round].map(match => renderMatch(match))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Grand Final */}
                    {grandFinal && (
                        <section className="bracket-section grand-final-section">
                            <h2 className="bracket-title grand">
                                <span className="bracket-icon">👑</span>
                                Grand Final
                            </h2>
                            <div className="grand-final">
                                {renderMatch(grandFinal)}
                            </div>
                        </section>
                    )}

                    {/* Lower Bracket */}
                    <section className="bracket-section lower-bracket">
                        <h2 className="bracket-title lower">
                            <span className="bracket-icon">⚔️</span>
                            Lower Bracket
                        </h2>
                        <div className="bracket-rounds">
                            {Object.keys(lowerBracket).sort((a, b) => a - b).map(round => (
                                <div key={`lower-${round}`} className="bracket-round">
                                    <h3 className="round-title">{getRoundName(parseInt(round), 'lower')}</h3>
                                    <div className="round-matches">
                                        {lowerBracket[round].map(match => renderMatch(match))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* Statistics View */}
            {activeTab === 'stats' && tournamentStats && (
                <div className="stats-container">
                    {/* Summary Cards */}
                    <div className="stats-summary">
                        <div className="summary-card">
                            <span className="summary-icon">👥</span>
                            <span className="summary-value">{tournamentStats.summary.totalPlayers}</span>
                            <span className="summary-label">Jogadores</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-icon">⚔️</span>
                            <span className="summary-value">{tournamentStats.summary.totalMatches}</span>
                            <span className="summary-label">Total de Partidas</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-icon">✅</span>
                            <span className="summary-value">{tournamentStats.summary.completedMatches}</span>
                            <span className="summary-label">Finalizadas</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-icon">⏳</span>
                            <span className="summary-value">{tournamentStats.summary.pendingMatches}</span>
                            <span className="summary-label">Pendentes</span>
                        </div>
                    </div>

                    {/* Player Ranking */}
                    <div className="stats-ranking">
                        <h3 className="ranking-title">
                            <span>🏅</span>
                            Ranking de Jogadores
                        </h3>
                        <div className="ranking-table">
                            <div className="ranking-header">
                                <span className="rank-col">#</span>
                                <span className="player-col">Jogador</span>
                                <span className="wins-col">V</span>
                                <span className="losses-col">D</span>
                                <span className="winrate-col">Win%</span>
                                <span className="status-col">Status</span>
                            </div>
                            {tournamentStats.ranking.map((stat, index) => (
                                <Link
                                    key={stat.player.id}
                                    to={`/jogadores/${stat.player.id}?tournamentId=${id}`}
                                    className="ranking-row"
                                >
                                    <span className={`rank-col ${index < 3 ? `top-${index + 1}` : ''}`}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                    </span>
                                    <span className="player-col">
                                        <span className="player-avatar">👤</span>
                                        <span className="player-details">
                                            <span className="player-name">{stat.player.nickname}</span>
                                            <span className="player-tag">#{stat.player.tag}</span>
                                        </span>
                                    </span>
                                    <span className="wins-col text-green">{stat.wins}</span>
                                    <span className="losses-col text-red">{stat.losses}</span>
                                    <span className={`winrate-col ${stat.winRate >= 50 ? 'text-green' : 'text-red'}`}>
                                        {stat.winRate}%
                                    </span>
                                    <span className={`status-col ${stat.status}`}>
                                        {stat.status === 'active' ? '🎮 Ativo' :
                                            stat.status === 'eliminated' ? '❌ Eliminado' : '🏆 Campeão'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Round Performance */}
                    <div className="stats-rounds">
                        <h3 className="rounds-title">
                            <span>📈</span>
                            Desempenho por Rodada
                        </h3>
                        <div className="rounds-grid">
                            <div className="rounds-column upper">
                                <h4>Upper Bracket</h4>
                                {Object.keys(upperBracket).sort((a, b) => a - b).map(round => {
                                    const roundMatches = upperBracket[round];
                                    const completed = roundMatches.filter(m => m.winnerId).length;
                                    return (
                                        <div key={round} className="round-progress">
                                            <span className="round-name">{getRoundName(parseInt(round), 'upper')}</span>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${(completed / roundMatches.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="round-count">{completed}/{roundMatches.length}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="rounds-column lower">
                                <h4>Lower Bracket</h4>
                                {Object.keys(lowerBracket).sort((a, b) => a - b).map(round => {
                                    const roundMatches = lowerBracket[round];
                                    const completed = roundMatches.filter(m => m.winnerId).length;
                                    return (
                                        <div key={round} className="round-progress">
                                            <span className="round-name">{getRoundName(parseInt(round), 'lower')}</span>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${(completed / roundMatches.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="round-count">{completed}/{roundMatches.length}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Score Modal */}
            {scoreModal && selectedMatch && (
                <div className="modal-overlay" onClick={() => setScoreModal(false)}>
                    <div className="modal score-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span>⚔️</span>
                                Registrar Resultado
                            </h2>
                            <button className="modal-close" onClick={() => setScoreModal(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <p className="format-info">
                                Formato: <strong>{tournament.matchFormat}</strong> -
                                Primeiro a {getWinsRequired()} vitórias
                            </p>

                            <div className="score-inputs">
                                <div className="score-player">
                                    <span className="player-name">{selectedMatch.player1?.nickname}</span>
                                    <div className="score-controls">
                                        <button
                                            type="button"
                                            onClick={() => handleScoreChange('player1', scores.player1 - 1)}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={scores.player1}
                                            onChange={(e) => handleScoreChange('player1', e.target.value)}
                                            min="0"
                                            max={getWinsRequired()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleScoreChange('player1', scores.player1 + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <span className="vs-divider">VS</span>

                                <div className="score-player">
                                    <span className="player-name">{selectedMatch.player2?.nickname}</span>
                                    <div className="score-controls">
                                        <button
                                            type="button"
                                            onClick={() => handleScoreChange('player2', scores.player2 - 1)}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={scores.player2}
                                            onChange={(e) => handleScoreChange('player2', e.target.value)}
                                            min="0"
                                            max={getWinsRequired()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleScoreChange('player2', scores.player2 + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setScoreModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={submitScore}
                                    disabled={scores.player1 < getWinsRequired() && scores.player2 < getWinsRequired()}
                                >
                                    Confirmar Resultado
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Bracket;
