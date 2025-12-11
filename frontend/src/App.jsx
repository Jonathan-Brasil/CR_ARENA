import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/feature/Dashboard/Dashboard';
import Tournaments from './pages/feature/Tournaments/Tournaments';
import CreateTournament from './pages/feature/CreateTournament/CreateTournament';
import Bracket from './pages/feature/Bracket/Bracket';
import Players from './pages/feature/Players/Players';
import PlayerDetails from './pages/feature/PlayerDetails/PlayerDetails';
import Statistics from './pages/feature/Statistics/Statistics';
import Friendlies from './pages/feature/Friendlies/Friendlies';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/torneios" element={<Tournaments />} />
            <Route path="/torneios/novo" element={<CreateTournament />} />
            <Route path="/torneios/:id/bracket" element={<Bracket />} />
            <Route path="/jogadores" element={<Players />} />
            <Route path="/jogadores/:id" element={<PlayerDetails />} />
            <Route path="/estatisticas" element={<Statistics />} />
            <Route path="/amistosos" element={<Friendlies />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
