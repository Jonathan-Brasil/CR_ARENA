import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TournamentCard from '../../../components/TournamentCard';
import './Dashboard.css';

const API_URL = 'http://localhost:3001';

function Dashboard() {
    const [stats, setStats] = useState({
        activeTournaments: 0,
        totalPlayers: 0,
        matchesToday: 0,
        upcomingTournaments: 0
    });
    const [activeTournaments, setActiveTournaments] = useState([]);
    const [upcomingTournaments, setUpcomingTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch stats
            const statsRes = await fetch(`${API_URL}/api/stats`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch tournaments
            const tournamentsRes = await fetch(`${API_URL}/api/tournaments`);
            if (tournamentsRes.ok) {
                const tournaments = await tournamentsRes.json();
                setActiveTournaments(tournaments.filter(t => t.status === 'active').slice(0, 2));
                setUpcomingTournaments(tournaments.filter(t => t.status === 'upcoming').slice(0, 2));
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard animate-fade-in">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">CR ARENA</h1>
                    <p className="hero-subtitle">
                        Gerencie torneios de Clash Royale com sistema de Dupla Eliminação, estatísticas detalhadas
                        e chaveamento profissional.
                    </p>
                    <div className="hero-actions">
                        <Link to="/torneios/novo" className="btn btn-primary btn-lg">
                            <span>+</span>
                            <span>Criar Torneio</span>
                        </Link>
                        <Link to="/torneios" className="btn btn-secondary btn-lg">
                            <span>Ver Torneios</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon gold">🏆</div>
                        <div className="stat-content">
                            <span className="stat-value text-gold">{stats.activeTournaments}</span>
                            <span className="stat-label">Torneios Ativos</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon blue">👥</div>
                        <div className="stat-content">
                            <span className="stat-value text-blue">{stats.totalPlayers}</span>
                            <span className="stat-label">Jogadores</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon red">⚔️</div>
                        <div className="stat-content">
                            <span className="stat-value text-red">{stats.matchesToday}</span>
                            <span className="stat-label">Partidas Hoje</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon purple">📅</div>
                        <div className="stat-content">
                            <span className="stat-value text-cyan">{stats.upcomingTournaments}</span>
                            <span className="stat-label">Em Breve</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Active Tournaments */}
            <section className="tournaments-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <span className="section-icon">🏆</span>
                        Torneios Ativos
                    </h2>
                    <Link to="/torneios?status=active" className="section-link">
                        Ver todos <span>→</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : activeTournaments.length > 0 ? (
                    <div className="tournaments-grid">
                        {activeTournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p className="empty-text">Nenhum torneio ativo no momento</p>
                        <Link to="/torneios/novo" className="btn btn-primary">
                            Criar Primeiro Torneio
                        </Link>
                    </div>
                )}
            </section>

            {/* Upcoming Tournaments */}
            <section className="tournaments-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <span className="section-icon">📅</span>
                        Em Breve
                    </h2>
                    <Link to="/torneios?status=upcoming" className="section-link">
                        Ver todos <span>→</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : upcomingTournaments.length > 0 ? (
                    <div className="tournaments-grid">
                        {upcomingTournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p className="empty-text">Nenhum torneio programado</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Dashboard;
