import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../../../config/api';
import './CreateTournament.css';

function CreateTournament() {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        matchFormat: 'MD3',
        selectedPlayers: []
    });

    const matchFormats = [
        { id: 'MD3', label: 'MD3', description: 'Melhor de 3' },
        { id: 'MD5', label: 'MD5', description: 'Melhor de 5' },
        { id: 'MD7', label: 'MD7', description: 'Melhor de 7' }
    ];

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const togglePlayer = (playerId) => {
        setFormData(prev => {
            const selected = prev.selectedPlayers.includes(playerId)
                ? prev.selectedPlayers.filter(id => id !== playerId)
                : [...prev.selectedPlayers, playerId];
            return { ...prev, selectedPlayers: selected };
        });
    };

    const isValidPlayerCount = () => {
        const count = formData.selectedPlayers.length;
        // Deve ser potência de 2: 4, 8, 16, 32
        return count >= 4 && (count & (count - 1)) === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.startDate || formData.selectedPlayers.length < 4) {
            alert('Preencha todos os campos obrigatórios e selecione pelo menos 4 jogadores.');
            return;
        }

        if (!isValidPlayerCount()) {
            alert('O número de jogadores deve ser uma potência de 2 (4, 8, 16 ou 32).');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/tournaments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    startDate: formData.startDate,
                    matchFormat: formData.matchFormat,
                    playerIds: formData.selectedPlayers,
                    maxPlayers: formData.selectedPlayers.length
                })
            });

            if (response.ok) {
                const created = await response.json();
                navigate(`/torneios/${created.id}/bracket`);
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao criar torneio');
            }
        } catch (error) {
            console.error('Erro ao criar torneio:', error);
            alert('Erro ao criar torneio. Verifique a conexão.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-tournament-page animate-fade-in">
            <div className="page-nav">
                <Link to="/torneios" className="back-link">
                    <span>←</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-title-icon">🏆</span>
                    Novo Torneio
                </h1>
                <p className="page-subtitle">Configure um novo torneio de Dupla Eliminação</p>
            </div>

            <form onSubmit={handleSubmit} className="tournament-form">
                {/* Basic Info */}
                <div className="form-section card">
                    <h2 className="section-title">
                        <span>📋</span>
                        Informações Básicas
                    </h2>

                    <div className="form-group">
                        <label className="form-label required">Nome do Torneio</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Ex: Arena Masters Cup"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Descrição</label>
                        <textarea
                            name="description"
                            className="form-textarea"
                            placeholder="Descrição do torneio..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Data de Início</label>
                        <input
                            type="date"
                            name="startDate"
                            className="form-input"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Match Format */}
                <div className="form-section card">
                    <h2 className="section-title">
                        <span>⚔️</span>
                        Formato das Partidas
                    </h2>
                    <p className="section-desc">Escolha quantos jogos são necessários para vencer uma partida</p>

                    <div className="format-options">
                        {matchFormats.map(format => (
                            <button
                                key={format.id}
                                type="button"
                                className={`format-option ${formData.matchFormat === format.id ? 'active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, matchFormat: format.id }))}
                            >
                                <span className="format-label">{format.label}</span>
                                <span className="format-desc">{format.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Player Selection */}
                <div className="form-section card">
                    <h2 className="section-title">
                        <span>👥</span>
                        Selecionar Jogadores
                    </h2>
                    <p className="section-desc">
                        {formData.selectedPlayers.length} jogador(es) selecionado(s)
                        {formData.selectedPlayers.length > 0 && !isValidPlayerCount() && (
                            <span className="warning-text"> - Selecione 4, 8, 16 ou 32 jogadores</span>
                        )}
                    </p>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                        </div>
                    ) : players.length > 0 ? (
                        <div className="players-selection">
                            {players.map(player => (
                                <button
                                    key={player.id}
                                    type="button"
                                    className={`player-option ${formData.selectedPlayers.includes(player.id) ? 'selected' : ''}`}
                                    onClick={() => togglePlayer(player.id)}
                                >
                                    <div className="player-checkbox">
                                        {formData.selectedPlayers.includes(player.id) && <span>✓</span>}
                                    </div>
                                    <div className="player-info">
                                        <span className="player-name">{player.nickname}</span>
                                        <span className="player-tag">#{player.tag}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-players">
                            <p>Nenhum jogador cadastrado</p>
                            <Link to="/jogadores" className="btn btn-secondary">
                                Cadastrar Jogadores
                            </Link>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <Link to="/torneios" className="btn btn-ghost btn-lg">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={submitting || !formData.name || !formData.startDate || !isValidPlayerCount()}
                    >
                        {submitting ? 'Criando...' : 'Criar Torneio'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateTournament;
