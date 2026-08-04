import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AuthProvider } from './contexts/AuthContext';
import { InvestigationProvider } from './contexts/InvestigationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';
import Layout from './components/Layout';
import AmbientMusicPlayer from './components/AmbientMusicPlayer';
import StartupSplash from './components/StartupSplash';
import { SocketNotificationsBridge } from './contexts/SocketNotificationsBridge';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const CreateRoom = lazy(() => import('./pages/CreateRoom'));
const JoinRoom = lazy(() => import('./pages/JoinRoom'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Game = lazy(() => import('./pages/Game'));
const Cases = lazy(() => import('./pages/Cases'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const Friends = lazy(() => import('./pages/Friends'));
const Settings = lazy(() => import('./pages/Settings'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const LobbyList = lazy(() => import('./pages/LobbyList'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Tutorial = lazy(() => import('./pages/Tutorial'));
const RecoveryCode = lazy(() => import('./pages/RecoveryCode'));
const Briefing = lazy(() => import('./pages/Briefing'));
const RoomEntry = lazy(() => import('./pages/RoomEntry'));
const MapOverview = lazy(() => import('./pages/MapOverview'));
const SceneExplorer = lazy(() => import('./pages/SceneExplorer'));
const InvestigationBoard = lazy(() => import('./pages/InvestigationBoard'));
const CaseFiles = lazy(() => import('./pages/CaseFiles'));
const EvidenceAnalysis = lazy(() => import('./pages/EvidenceAnalysis'));
const ResetCaseProgress = lazy(() => import('./pages/ResetCaseProgress'));

function App() {
  return (
    <SocketProvider>
      <AuthProvider>
      <SettingsProvider>
      <NotificationsProvider>
      <div className="app-container">
        <BrowserRouter>
          <InvestigationProvider>
            <StartupSplash />
            <SocketNotificationsBridge />
            <AmbientMusicPlayer />
            <Suspense fallback={<Loading message="Carregando página..." />}>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/register" element={<Layout><Register /></Layout>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/tutorial" element={<Layout><Tutorial /></Layout>} />

              {/* Rotas protegidas */}
              <Route path="/create" element={<Layout><ProtectedRoute><CreateRoom /></ProtectedRoute></Layout>} />
              <Route path="/join" element={<Layout><ProtectedRoute><JoinRoom /></ProtectedRoute></Layout>} />
              <Route path="/cases" element={<Layout><Cases /></Layout>} />
              <Route path="/messages" element={<Layout><Messages /></Layout>} />
              <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
              <Route path="/friends" element={<Layout><ProtectedRoute><Friends /></ProtectedRoute></Layout>} />
              <Route path="/settings" element={<Layout><ProtectedRoute><Settings /></ProtectedRoute></Layout>} />
              <Route path="/reset-case/:caseSlug" element={<Layout><ProtectedRoute><ResetCaseProgress /></ProtectedRoute></Layout>} />
              <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
              <Route path="/terms" element={<Layout><Terms /></Layout>} />
              <Route path="/lobby" element={<Layout><ProtectedRoute><LobbyList /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/lobby" element={<Layout><ProtectedRoute><Lobby /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomCode" element={<Layout><ProtectedRoute><RoomEntry /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/recovery" element={<Layout><ProtectedRoute><RecoveryCode /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/briefing" element={<Layout><ProtectedRoute><Briefing /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/game" element={<Layout><ProtectedRoute><Game /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/feedback" element={<Layout><ProtectedRoute><Feedback /></ProtectedRoute></Layout>} />
              <Route path="/room/:roomId/messages" element={<Navigate to="/messages" replace />} />
              
              {/* Immersive Redesign Prototypes */}
              <Route path="/map/:caseId" element={<Layout><ProtectedRoute><MapOverview /></ProtectedRoute></Layout>} />
              <Route path="/scene/:sceneId" element={<Layout><ProtectedRoute><SceneExplorer /></ProtectedRoute></Layout>} />
              <Route path="/board/:caseId" element={<Layout><ProtectedRoute><InvestigationBoard /></ProtectedRoute></Layout>} />
              <Route path="/case-files/:caseId" element={<Layout><ProtectedRoute><CaseFiles /></ProtectedRoute></Layout>} />
              <Route path="/evidence/:evidenceId" element={<Layout><ProtectedRoute><EvidenceAnalysis /></ProtectedRoute></Layout>} />
            </Routes>
            </Suspense>
          </InvestigationProvider>
        </BrowserRouter>
      </div>
      </NotificationsProvider>
      </SettingsProvider>
      </AuthProvider>
    </SocketProvider>
  );
}

export default App;
