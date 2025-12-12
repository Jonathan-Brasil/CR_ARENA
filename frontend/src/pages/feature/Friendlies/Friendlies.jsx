import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../../config/api';
import './Friendlies.css';

function Friendlies() {
    const [friendlies, setFriendlies] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedFriendly, setSelectedFriendly] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const [newFriendly, setNewFriendly] = useState({
        player1Id: '',
        player2Id: '',
        matchFormat: 'MD3'
    });

    const [scores, setScores] = useState({ player1: 0, player2: 0 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [friendliesRes, playersRes] = await Promise.all([
                fetch(`${API_URL}/api/friendlies`),
                fetch(`${API_URL}/api/players`)
            ]);

            if (friendliesRes.ok) {
                const data = await friendliesRes.json();
                setFriendlies(data);
            }

            if (playersRes.ok) {
                const data = await playersRes.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFriendlies = friendlies.filter(f => {
        if (activeTab === 'pending') return f.status === 'pending';
        if (activeTab === 'completed') return f.status === 'completed';
        return true;
    });

    const getWinsRequired = (format) => {
        if (format === 'MD5') return 3;
        if (format === 'MD7') return 4;
        return 2;
    };

    const handleCreateFriendly = async (e) => {
        e.preventDefault();
        if (!newFriendly.player1Id || !newFriendly.player2Id) return;
        if (newFriendly.player1Id === newFriendly.player2Id) {
            alert('Selecione dois jogadores diferentes');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/friendlies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFriendly)
            });

            if (response.ok) {
                const created = await response.json();
                setFriendlies(prev => [created, ...prev]);
                setShowModal(false);
                setNewFriendly({ player1Id: '', player2Id: '', matchFormat: 'MD3' });
            }
        } catch (error) {
            console.error('Erro ao criar amistoso:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const openResultModal = (friendly) => {
        setSelectedFriendly(friendly);
        setScores({
            player1: friendly.player1Score || 0,
            player2: friendly.player2Score || 0
        });
        setShowResultModal(true);
    };

    const handleScoreChange = (player, value) => {
        const winsRequired = getWinsRequired(selectedFriendly.matchFormat);
        const newValue = Math.max(0, Math.min(winsRequired, parseInt(value) || 0));
        setScores(prev => ({ ...prev, [player]: newValue }));
    };

    const submitResult = async () => {
        if (!selectedFriendly) return;

        const winsRequired = getWinsRequired(selectedFriendly.matchFormat);

        if (scores.player1 < winsRequired && scores.player2 < winsRequired) {
            alert(`Uma das pontuações deve ser ${winsRequired} para determinar o vencedor`);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/friendlies/${selectedFriendly.id}/result`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player1Score: scores.player1,
                    player2Score: scores.player2
                })
            });

            if (response.ok) {
                const updated = await response.json();
                setFriendlies(prev => prev.map(f => f.id === updated.id ? updated : f));
                setShowResultModal(false);
                setSelectedFriendly(null);
            }
        } catch (error) {
            console.error('Erro ao registrar resultado:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="friendlies-page animate-fade-in">
            <div className="page-header">
                <div className="page-title-row">
                    <div>
                        <h1 className="page-title">
                            <span className="page-title-icon">🤝</span>
                            Amistosos
                        </h1>
                        <p className="page-subtitle">Partidas fora de torneios entre dois jogadores</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <span>+</span>
                        <span>Novo Amistoso</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Todos ({friendlies.length})
                </button>
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Aguardando ({friendlies.filter(f => f.status === 'pending').length})
                </button>
                <button
                    className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Finalizados ({friendlies.filter(f => f.status === 'completed').length})
                </button>
            </div>

            {/* Friendlies List */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                </div>
            ) : filteredFriendlies.length > 0 ? (
                <div className="friendlies-list">
                    {filteredFriendlies.map(friendly => (
                        <div
                            key={friendly.id}
                            className={`friendly-card ${friendly.status === 'pending' ? 'pending' : 'completed'}`}
                            onClick={() => friendly.status === 'pending' && openResultModal(friendly)}
                        >
                            <div className="friendly-players">
                                <div className={`player-side ${friendly.winnerId === friendly.player1Id ? 'winner' : ''}`}>
                                    <span className="player-avatar">👤</span>
                                    <div className="player-info">
                                        <span className="player-name">{friendly.player1?.nickname || 'Jogador 1'}</span>
                                        <span className="player-tag">#{friendly.player1?.tag}</span>
                                    </div>
                                    <span className="player-score">{friendly.player1Score}</span>
                                </div>

                                <div className="vs-badge">
                                    <span className="format-badge">{friendly.matchFormat}</span>
                                    <span className="vs-text">VS</span>
                                </div>

                                <div className={`player-side ${friendly.winnerId === friendly.player2Id ? 'winner' : ''}`}>
                                    <span className="player-score">{friendly.player2Score}</span>
                                    <div className="player-info">
                                        <span className="player-name">{friendly.player2?.nickname || 'Jogador 2'}</span>
                                        <span className="player-tag">#{friendly.player2?.tag}</span>
                                    </div>
                                    <span className="player-avatar">👤</span>
                                </div>
                            </div>

                            <div className="friendly-footer">
                                {friendly.status === 'pending' ? (
                                    <span className="status-badge pending">⏳ Aguardando Resultado</span>
                                ) : (
                                    <span className="status-badge completed">
                                        🏆 Vencedor: {friendly.winner?.nickname}
                                    </span>
                                )}
                                <span className="friendly-date">
                                    {friendly.completedAt ? formatDate(friendly.completedAt) : formatDate(friendly.createdAt)}
                                </span>
                            </div>

                            {friendly.status === 'pending' && (
                                <div className="click-hint">Clique para registrar resultado</div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🤝</div>
                    <h3 className="empty-state-title">Nenhum amistoso encontrado</h3>
                    <p className="empty-state-desc">Crie um amistoso entre dois jogadores</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Criar Amistoso
                    </button>
                </div>
            )}

            {/* Modal - Novo Amistoso */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span>🤝</span>
                                Novo Amistoso
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreateFriendly} className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">Jogador 1</label>
                                <select
                                    className="form-select form-input"
                                    value={newFriendly.player1Id}
                                    onChange={(e) => setNewFriendly(prev => ({ ...prev, player1Id: e.target.value }))}
                                    required
                                >
                                    <option value="">Selecione um jogador</option>
                                    {players.map(player => (
                                        <option key={player.id} value={player.id} disabled={player.id === parseInt(newFriendly.player2Id)}>
                                            {player.nickname} (#{player.tag})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Jogador 2</label>
                                <select
                                    className="form-select form-input"
                                    value={newFriendly.player2Id}
                                    onChange={(e) => setNewFriendly(prev => ({ ...prev, player2Id: e.target.value }))}
                                    required
                                >
                                    <option value="">Selecione um jogador</option>
                                    {players.map(player => (
                                        <option key={player.id} value={player.id} disabled={player.id === parseInt(newFriendly.player1Id)}>
                                            {player.nickname} (#{player.tag})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Formato da Série</label>
                                <div className="format-options">
                                    {['MD3', 'MD5', 'MD7'].map(format => (
                                        <button
                                            key={format}
                                            type="button"
                                            className={`format-option ${newFriendly.matchFormat === format ? 'active' : ''}`}
                                            onClick={() => setNewFriendly(prev => ({ ...prev, matchFormat: format }))}
                                        >
                                            <span className="format-label">{format}</span>
                                            <span className="format-desc">
                                                Melhor de {format === 'MD3' ? '3' : format === 'MD5' ? '5' : '7'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !newFriendly.player1Id || !newFriendly.player2Id}
                                >
                                    {submitting ? 'Criando...' : 'Criar Amistoso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - Registrar Resultado */}
            {showResultModal && selectedFriendly && (
                <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
                    <div className="modal score-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span>⚔️</span>
                                Registrar Resultado
                            </h2>
                            <button className="modal-close" onClick={() => setShowResultModal(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <p className="format-info">
                                Formato: <strong>{selectedFriendly.matchFormat}</strong> -
                                Primeiro a {getWinsRequired(selectedFriendly.matchFormat)} vitórias
                            </p>

                            <div className="score-inputs">
                                <div className="score-player">
                                    <span className="player-name">{selectedFriendly.player1?.nickname}</span>
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
                                            max={getWinsRequired(selectedFriendly.matchFormat)}
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
                                    <span className="player-name">{selectedFriendly.player2?.nickname}</span>
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
                                            max={getWinsRequired(selectedFriendly.matchFormat)}
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
                                <button className="btn btn-ghost" onClick={() => setShowResultModal(false)}>
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={submitResult}
                                    disabled={submitting || (scores.player1 < getWinsRequired(selectedFriendly.matchFormat) && scores.player2 < getWinsRequired(selectedFriendly.matchFormat))}
                                >
                                    {submitting ? 'Salvando...' : 'Confirmar Resultado'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Friendlies;
