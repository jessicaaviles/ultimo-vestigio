import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Cases from './pages/Cases';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import LobbyList from './pages/LobbyList';
import Feedback from './pages/Feedback';
import Tutorial from './pages/Tutorial';
import RecoveryCode from './pages/RecoveryCode';
import Briefing from './pages/Briefing';
import RoomEntry from './pages/RoomEntry';
import Layout from './components/Layout';
import { SocketNotificationsBridge } from './contexts/SocketNotificationsBridge';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <NotificationsProvider>
      <div className="app-container">
        <BrowserRouter>
          <SocketNotificationsBridge />
          <Routes>
            {/* Rotas com Bottom Navigation */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/create" element={<Layout><CreateRoom /></Layout>} />
            <Route path="/join" element={<Layout><JoinRoom /></Layout>} />
            <Route path="/cases" element={<Layout><Cases /></Layout>} />
            <Route path="/messages" element={<Layout><Messages /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/lobby" element={<Layout><LobbyList /></Layout>} />
            <Route path="/room/:roomId/lobby" element={<Layout><Lobby /></Layout>} />
            <Route path="/room/:roomCode" element={<Layout><RoomEntry /></Layout>} />
            <Route path="/room/:roomId/recovery" element={<Layout><RecoveryCode /></Layout>} />
            <Route path="/room/:roomId/briefing" element={<Layout><Briefing /></Layout>} />
            <Route path="/room/:roomId/game" element={<Layout><Game /></Layout>} />
            <Route path="/room/:roomId/feedback" element={<Layout><Feedback /></Layout>} />
            <Route path="/tutorial" element={<Layout><Tutorial /></Layout>} />
          </Routes>
        </BrowserRouter>
      </div>
      </NotificationsProvider>
    </SocketProvider>
  );
}

export default App;
