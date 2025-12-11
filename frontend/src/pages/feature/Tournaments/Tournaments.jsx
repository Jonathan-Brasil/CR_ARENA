import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TournamentCard from '../../../components/TournamentCard';
import './Tournaments.css';

const API_URL = 'http://localhost:3001';

function Tournaments() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tournaments, setTournaments] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');

    const tabs = [
        { id: 'all', label: 'Todos' },
        { id: 'active', label: 'Ativos' },
        { id: 'upcoming', label: 'Em Breve' },
        { id: 'finished', label: 'Finalizados' }
    ];

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        filterTournaments();
    }, [tournaments, activeTab, searchTerm]);

    const fetchTournaments = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tournaments`);
            if (response.ok) {
                const data = await response.json();
                setTournaments(data);
            }
        } catch (error) {
            console.error('Erro ao buscar torneios:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTournaments = () => {
        let filtered = [...tournaments];

        // Filter by status
        if (activeTab !== 'all') {
            filtered = filtered.filter(t => t.status === activeTab);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(term) ||
                (t.description && t.description.toLowerCase().includes(term))
            );
        }

        setFilteredTournaments(filtered);
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (tabId === 'all') {
            searchParams.delete('status');
        } else {
            searchParams.set('status', tabId);
        }
        setSearchParams(searchParams);
    };

    const getTabCount = (tabId) => {
        if (tabId === 'all') return tournaments.length;
        return tournaments.filter(t => t.status === tabId).length;
    };

    return (
        <div className="tournaments-page animate-fade-in">
            <div className="page-header">
                <div className="page-title-row">
                    <div>
                        <h1 className="page-title">
                            <span className="page-title-icon">🏆</span>
                            Torneios
                        </h1>
                        <p className="page-subtitle">Gerencie e acompanhe todos os torneios</p>
                    </div>
                    <Link to="/torneios/novo" className="btn btn-primary">
                        <span>+</span>
                        <span>Novo Torneio</span>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="search-container">
                <div className="search-input">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar torneios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                    >
                        {tab.label} ({getTabCount(tab.id)})
                    </button>
                ))}
            </div>

            {/* Tournaments Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                </div>
            ) : filteredTournaments.length > 0 ? (
                <div className="tournaments-grid">
                    {filteredTournaments.map(tournament => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <h3 className="empty-state-title">Nenhum torneio encontrado</h3>
                    <p className="empty-state-desc">
                        {searchTerm
                            ? 'Tente buscar com outros termos'
                            : 'Crie seu primeiro torneio para começar'}
                    </p>
                    {!searchTerm && (
                        <Link to="/torneios/novo" className="btn btn-primary">
                            Criar Torneio
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default Tournaments;
