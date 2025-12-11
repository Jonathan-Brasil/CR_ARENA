import { Link } from 'react-router-dom';
import './PlayerCard.css';

function PlayerCard({ player }) {
    const calculateWinRate = () => {
        const wins = player.wins || 0;
        const losses = player.losses || 0;
        const total = wins + losses;
        if (total === 0) return 0;
        return Math.round((wins / total) * 100);
    };

    const winRate = calculateWinRate();

    return (
        <Link to={`/jogadores/${player.id}`} className="player-card card card-glow">
            <div className="card-header">
                <div className="card-avatar">
                    <span className="avatar-icon">👤</span>
                    {player.trophies && player.trophies >= 7000 && (
                        <span className="trophy-badge">🏅</span>
                    )}
                </div>
                <div className="card-player-info">
                    <h3 className="card-player-name">{player.nickname}</h3>
                    <span className="card-player-tag">#{player.tag}</span>
                    {player.clan && (
                        <span className="card-player-clan">
                            <span className="clan-icon">🛡️</span>
                            {player.clan}
                        </span>
                    )}
                </div>
                {player.trophies && (
                    <div className="card-trophies">
                        <span className="trophies-icon">🏆</span>
                        <span className="trophies-value">{player.trophies.toLocaleString()}</span>
                        <span className="trophies-label">Troféus</span>
                    </div>
                )}
            </div>

            <div className="card-stats">
                <div className="stat-item wins">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value">{player.wins || 0}</span>
                    <span className="stat-label">Vitórias</span>
                </div>
                <div className="stat-item losses">
                    <span className="stat-icon">❌</span>
                    <span className="stat-value">{player.losses || 0}</span>
                    <span className="stat-label">Derrotas</span>
                </div>
                <div className="stat-item winrate">
                    <span className={`stat-value ${winRate >= 50 ? 'text-green' : winRate > 0 ? 'text-red' : ''}`}>
                        {winRate}%
                    </span>
                    <span className="stat-label">Win Rate</span>
                </div>
            </div>
        </Link>
    );
}

export default PlayerCard;
