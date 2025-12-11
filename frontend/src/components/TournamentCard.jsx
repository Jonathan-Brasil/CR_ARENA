import { Link } from 'react-router-dom';
import './TournamentCard.css';

function TournamentCard({ tournament }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'Data não definida';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'active': { label: 'Ativo', class: 'badge-active' },
            'upcoming': { label: 'Em Breve', class: 'badge-upcoming' },
            'finished': { label: 'Finalizado', class: 'badge-finished' }
        };
        return statusMap[status] || statusMap['upcoming'];
    };

    const status = getStatusBadge(tournament.status);

    return (
        <div className="tournament-card card card-glow">
            <div className="tournament-header">
                <div className="tournament-info">
                    <h3 className="tournament-name">{tournament.name}</h3>
                    <p className="tournament-description">{tournament.description}</p>
                </div>
                <span className={`badge ${status.class}`}>{status.label}</span>
            </div>

            <div className="tournament-details">
                <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">{formatDate(tournament.startDate)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-icon">👥</span>
                    <span className="detail-text">{tournament.currentPlayers || 0}/{tournament.maxPlayers || 16}</span>
                </div>
            </div>

            <div className="tournament-format">
                <div className="format-item">
                    <span className="format-icon">🏆</span>
                    <span className="format-text">Dupla Eliminação</span>
                </div>
                <span className="format-mdx text-gold">{tournament.matchFormat || 'MD3'}</span>
            </div>

            <Link
                to={`/torneios/${tournament.id}/bracket`}
                className="tournament-action btn btn-secondary"
            >
                <span>Ver Chaveamento</span>
                <span className="action-arrow">→</span>
            </Link>
        </div>
    );
}

export default TournamentCard;
