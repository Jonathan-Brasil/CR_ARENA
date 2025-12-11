import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path) => {
        return location.pathname === path;
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    // Fechar menu quando a rota mudar
    useEffect(() => {
        closeMenu();
    }, [location.pathname]);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeMenu}>
                    <span className="brand-icon">🏆</span>
                    <span className="brand-text">CR ARENA</span>
                </Link>

                <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                    <Link
                        to="/"
                        className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="link-icon">🏠</span>
                        <span className="link-text">Dashboard</span>
                    </Link>

                    <Link
                        to="/torneios"
                        className={`navbar-link ${isActive('/torneios') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="link-icon">⚔️</span>
                        <span className="link-text">Torneios</span>
                    </Link>

                    <Link
                        to="/jogadores"
                        className={`navbar-link ${isActive('/jogadores') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="link-icon">👥</span>
                        <span className="link-text">Jogadores</span>
                    </Link>

                    <Link
                        to="/amistosos"
                        className={`navbar-link ${isActive('/amistosos') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="link-icon">🤝</span>
                        <span className="link-text">Amistosos</span>
                    </Link>

                    <Link
                        to="/estatisticas"
                        className={`navbar-link ${isActive('/estatisticas') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="link-icon">📊</span>
                        <span className="link-text">Estatísticas</span>
                    </Link>
                </div>

                <button
                    className={`navbar-mobile-toggle ${isMenuOpen ? 'active' : ''}`}
                    aria-label="Menu"
                    onClick={toggleMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
