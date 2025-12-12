import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PlayerCard from '../../../components/PlayerCard';
import API_URL from '../../../config/api';
import './Players.css';

function Players() {
    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newPlayer, setNewPlayer] = useState({
        nickname: '',
        tag: '',
        clan: '',
        trophies: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPlayers();
    }, []);

    useEffect(() => {
        filterPlayers();
    }, [players, searchTerm]);

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

    const filterPlayers = () => {
        if (!searchTerm) {
            setFilteredPlayers(players);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = players.filter(p =>
            p.nickname.toLowerCase().includes(term) ||
            p.tag.toLowerCase().includes(term) ||
            (p.clan && p.clan.toLowerCase().includes(term))
        );
        setFilteredPlayers(filtered);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPlayer(prev => ({ ...prev, [name]: value }));
    };

    const generateTag = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let tag = '';
        for (let i = 0; i < 8; i++) {
            tag += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPlayer(prev => ({ ...prev, tag }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPlayer.nickname || !newPlayer.tag) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPlayer,
                    trophies: newPlayer.trophies ? parseInt(newPlayer.trophies) : 0
                })
            });

            if (response.ok) {
                const created = await response.json();
                setPlayers(prev => [created, ...prev]);
                setShowModal(false);
                setNewPlayer({ nickname: '', tag: '', clan: '', trophies: '' });
            }
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="players-page animate-fade-in">
            <div className="page-header">
                <div className="page-title-row">
                    <div>
                        <h1 className="page-title">
                            <span className="page-title-icon">👥</span>
                            Jogadores
                        </h1>
                        <p className="page-subtitle">{players.length} jogadores cadastrados</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <span>+</span>
                        <span>Novo Jogador</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="search-container">
                <div className="search-input">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar por nome ou tag..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Players Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                </div>
            ) : filteredPlayers.length > 0 ? (
                <div className="players-grid">
                    {filteredPlayers.map(player => (
                        <PlayerCard key={player.id} player={player} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <h3 className="empty-state-title">Nenhum jogador encontrado</h3>
                    <p className="empty-state-desc">
                        {searchTerm
                            ? 'Tente buscar com outros termos'
                            : 'Cadastre jogadores para participar dos torneios'}
                    </p>
                    {!searchTerm && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Cadastrar Jogador
                        </button>
                    )}
                </div>
            )}

            {/* Modal - New Player */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span>👤</span>
                                Novo Jogador
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">Nickname</label>
                                <input
                                    type="text"
                                    name="nickname"
                                    className="form-input"
                                    placeholder="Ex: ThunderKing"
                                    value={newPlayer.nickname}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Tag do Jogador</label>
                                <div className="input-with-button">
                                    <input
                                        type="text"
                                        name="tag"
                                        className="form-input"
                                        placeholder="Ex: 9YCQR2V8L"
                                        value={newPlayer.tag}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={generateTag}
                                    >
                                        Gerar
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Clã</label>
                                <input
                                    type="text"
                                    name="clan"
                                    className="form-input"
                                    placeholder="Ex: Nova eSports"
                                    value={newPlayer.clan}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Troféus</label>
                                <input
                                    type="number"
                                    name="trophies"
                                    className="form-input"
                                    placeholder="Ex: 7200"
                                    value={newPlayer.trophies}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !newPlayer.nickname || !newPlayer.tag}
                                >
                                    {submitting ? 'Criando...' : 'Criar Jogador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Players;
