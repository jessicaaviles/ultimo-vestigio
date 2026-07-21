import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AuthProvider } from './contexts/AuthContext';
import { InvestigationProvider } from './contexts/InvestigationContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import MapOverview from './pages/MapOverview';
import SceneExplorer from './pages/SceneExplorer';
import InvestigationBoard from './pages/InvestigationBoard';
import CaseFiles from './pages/CaseFiles';
import EvidenceAnalysis from './pages/EvidenceAnalysis';
import Layout from './components/Layout';
import { SocketNotificationsBridge } from './contexts/SocketNotificationsBridge';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <AuthProvider>
      <NotificationsProvider>
      <div className="app-container">
        <BrowserRouter>
          <InvestigationProvider>
            <SocketNotificationsBridge />
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/register" element={<Layout><Register /></Layout>} />
              <Route path="/tutorial" element={<Layout><Tutorial /></Layout>} />

              {/* Rotas protegidas */}
              <Route path="/create" element={<Layout><ProtectedRoute><CreateRoom /></ProtectedRoute></Layout>} />
              <Route path="/join" element={<Layout><ProtectedRoute><JoinRoom /></ProtectedRoute></Layout>} />
              <Route path="/cases" element={<Layout><ProtectedRoute><Cases /></ProtectedRoute></Layout>} />
              <Route path="/messages" element={<Layout><ProtectedRoute><Messages /></ProtectedRoute></Layout>} />
              <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
              <Route path="/lobby" element={<Layout><ProtectedRoute><LobbyList /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/lobby" element={<Layout><ProtectedRoute><Lobby /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomCode" element={<Layout><ProtectedRoute><RoomEntry /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/recovery" element={<Layout><ProtectedRoute><RecoveryCode /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/briefing" element={<Layout><ProtectedRoute><Briefing /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/game" element={<Layout><ProtectedRoute><Game /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/feedback" element={<Layout><ProtectedRoute><Feedback /></ProtectedRoute></Layout>} />
              
              {/* Immersive Redesign Prototypes */}
              <Route path="/map/:caseId" element={<Layout><ProtectedRoute><MapOverview /></ProtectedRoute></Layout>} />
              <Route path="/scene/:sceneId" element={<Layout><ProtectedRoute><SceneExplorer /></ProtectedRoute></Layout>} />
              <Route path="/board/:caseId" element={<Layout><ProtectedRoute><InvestigationBoard /></ProtectedRoute></Layout>} />
              <Route path="/case-files/:caseId" element={<Layout><ProtectedRoute><CaseFiles /></ProtectedRoute></Layout>} />
              <Route path="/evidence/:evidenceId" element={<Layout><ProtectedRoute><EvidenceAnalysis /></ProtectedRoute></Layout>} />
            </Routes>
          </InvestigationProvider>
        </BrowserRouter>
      </div>
      </NotificationsProvider>
      </AuthProvider>
    </SocketProvider>
  );
}

export default App;
