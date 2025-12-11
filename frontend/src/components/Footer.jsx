import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <span className="footer-logo">🏆</span>
                    <span className="footer-title">CR ARENA</span>
                    <span className="footer-year">© {currentYear}</span>
                </div>
                <p className="footer-text">
                    Plataforma de Torneios Clash Royale
                </p>
            </div>
        </footer>
    );
}

export default Footer;
