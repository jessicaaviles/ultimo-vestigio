import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Users, MessageCircle, UserRound, Menu, X, Copy, LogOut, Plus, LogIn } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useSocket } from '../contexts/useSocket';
import { createRoom, joinRoom } from '../services/api';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { notifications, hasAny } = useNotifications();

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : path === 'map' ? location.pathname.includes('/cases') : location.pathname.includes(path);

  const navItems = [
    { label: 'INVESTIGAÇÃO', route: '/', icon: Home, badge: false },
    { label: 'CASOS', route: 'map', icon: FolderOpen, badge: false },
    { label: 'SALAS', route: 'lobby', icon: Users, badge: notifications.rooms },
    { label: 'MENSAGENS', route: 'messages', icon: MessageCircle, badge: notifications.messages > 0 },
    { label: 'PERFIL', route: 'profile', icon: UserRound, badge: false },
  ];

  const socket = useSocket();
  const lobbyRef = useRef<HTMLDivElement>(null);
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [discoveredClueNotification, setDiscoveredClueNotification] = useState<{ title: string; desc: string } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('currentRoomId'));
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem('currentRoomCode'));
  const [players, setPlayers] = useState<any[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [loadingLobby, setLoadingLobby] = useState(false);
  const [lobbyError, setLobbyError] = useState('');

  // Sincronizar roomId a partir da URL se existir (ex: /room/:roomId/game)
  useEffect(() => {
    const urlMatch = location.pathname.match(/\/room\/([^/]+)/);
    if (urlMatch && urlMatch[1] !== roomId) {
      setRoomId(urlMatch[1]);
      localStorage.setItem('currentRoomId', urlMatch[1]);
    }
  }, [location.pathname, roomId]);

  // Socket listener para atualizar o estado da sala
  useEffect(() => {
    if (!socket || !roomId) return;
    
    const userId = localStorage.getItem('userId');
    socket.emit('join_room', { roomId, userId });

    const handleRoomUpdate = (data: any) => {
      setPlayers(data.players || []);
      if (data.public_code) {
        setRoomCode(data.public_code);
        localStorage.setItem('currentRoomCode', data.public_code);
      }
    };

    socket.on('room_state_updated', handleRoomUpdate);

    return () => {
      socket.off('room_state_updated', handleRoomUpdate);
    };
  }, [socket, roomId]);

  // Click outside para fechar o dropdown do lobby
  useEffect(() => {
    if (!lobbyOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (lobbyRef.current && !lobbyRef.current.contains(e.target as Node)) {
        setLobbyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [lobbyOpen]);

  const handleCreateRoom = async () => {
    setLoadingLobby(true);
    setLobbyError('');
    try {
      const userId = localStorage.getItem('userId') || 'anon_user';
      const userName = localStorage.getItem('userName') || 'Investigador';
      const caseId = 'blackwell'; // Caso padrão
      
      const res = await createRoom(caseId, userId, userName);
      if (res.success) {
        setRoomId(res.roomId);
        setRoomCode(res.publicCode);
        localStorage.setItem('currentRoomId', res.roomId);
        localStorage.setItem('currentRoomCode', res.publicCode);
      } else {
        setLobbyError(res.error || 'Erro ao criar sala.');
      }
    } catch (e) {
      setLobbyError('Erro de conexão com o servidor.');
    } finally {
      setLoadingLobby(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) return;
    setLoadingLobby(true);
    setLobbyError('');
    try {
      const userId = localStorage.getItem('userId') || 'anon_user';
      const userName = localStorage.getItem('userName') || 'Investigador';
      
      const res = await joinRoom(joinCodeInput.toUpperCase(), userId, userName);
      if (res.success && res.data) {
        const cleanCode = joinCodeInput.toUpperCase();
        setRoomId(res.data.roomId);
        setRoomCode(cleanCode);
        localStorage.setItem('currentRoomId', res.data.roomId);
        localStorage.setItem('currentRoomCode', cleanCode);
        setJoinCodeInput('');
      } else {
        setLobbyError(res.error || 'Código de sala inválido.');
      }
    } catch (e) {
      setLobbyError('Erro ao conectar na sala.');
    } finally {
      setLoadingLobby(false);
    }
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setRoomCode(null);
    setPlayers([]);
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem('currentRoomCode');
    // Se estiver em uma rota de sala específica (/room/.../game), navegar para a home
    if (location.pathname.includes('/room/')) {
      navigate('/');
    }
  };

  const handleNav = (route: string) => {
    if (route === '/') return navigate('/');
    if (route === 'map') return navigate('/cases');
    const activeRoomId = roomId || localStorage.getItem('currentRoomId');
    navigate(activeRoomId && route !== 'cases' && route !== 'profile' ? `/room/${activeRoomId}/${route}` : `/${route}`);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Scroll para o topo ao navegar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const clueTitles: Record<string, string> = {
        'window': 'Janela Entreaberta',
        'armchair': 'Poltrona Revirada',
        'table': 'Carta Anônima',
        'fireplace': 'Restos na Lareira',
        'blood': 'Sangue Artificial',
        'wine_glass': 'Taça Quebrada',
        'desk_letter': 'Carta de Helena',
        'safe': 'Cofre Oculto',
        'cigar': 'Charuto Apagado',
        'mirror_msg': 'Mensagem no Espelho',
        'suitcase': 'Mala Semi-Pronta',
        'pills': 'Vidro de Remédios',
        'fountain': 'Livro-caixa Desenterrado',
        'mud': 'Pegadas Duplas',
        'animal_bones': 'Ossos Pequenos'
      };

      const title = clueTitles[detail.clueId] || 'Nova Pista';
      setDiscoveredClueNotification({
        title,
        desc: `foi encontrada por ${detail.finderName}!`
      });

      setTimeout(() => {
        setDiscoveredClueNotification(null);
      }, 5000);
    };

    window.addEventListener('clue_discovered_notification', handleNotification);
    return () => window.removeEventListener('clue_discovered_notification', handleNotification);
  }, []);

  const isImmersive = location.pathname === '/' || ['/map', '/scene', '/board', '/case-files', '/evidence'].some(p => location.pathname.includes(p));

  return <div className="app-shell">
    <header className="topbar" style={{
      position: scrolled || location.pathname !== '/' ? 'fixed' : 'absolute',
      background: isImmersive || scrolled ? 'rgba(10, 13, 16, 0.4)' : 'transparent',
      backdropFilter: isImmersive || scrolled ? 'blur(4px)' : 'none',
      WebkitBackdropFilter: isImmersive || scrolled ? 'blur(4px)' : 'none'
    }}>
      {location.pathname !== '/' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button aria-label="Ir para início" onClick={() => navigate('/')} style={{ background: 'none', border: 0 }}>
            <img className="topbar-logo" src="/monograma-ultimo-vestigio.png" alt="Último Vestígio" />
          </button>
          {!['/', '/cases', '/lobby', '/messages', '/profile'].includes(location.pathname) && (
            <button onClick={() => navigate(-1)} style={{ color: '#8E989F', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px', lineHeight: 1 }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar
            </button>
          )}
        </div>
      ) : (
        <div style={{ width: '68px' }} />
      )}
      
      {/* Cooperative Lobby Widget */}
      {isImmersive && (
        <div className="lobby-wrapper" ref={lobbyRef} style={{ position: 'relative', marginRight: '8px' }}>
          <button
            onClick={() => setLobbyOpen(!lobbyOpen)}
            style={{
              background: roomId ? 'rgba(197, 168, 128, 0.15)' : 'rgba(255,255,255,0.03)',
              border: roomId ? '1px solid rgba(197, 168, 128, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: roomId ? '#C5A880' : '#8E989F',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              height: '38px',
              boxSizing: 'border-box'
            }}
          >
            <Users size={16} />
            <span className="lobby-btn-text" style={{ display: 'inline' }}>
              {roomId ? `Sala: ${roomCode}` : 'Jogar em Grupo'}
            </span>
          </button>

          {lobbyOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '280px',
                background: 'rgba(15, 20, 23, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 100,
                color: '#F8F9FA'
              }}
            >
              {!roomId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#C5A880', textTransform: 'uppercase', letterSpacing: '1px' }}>Investigar em Grupo</div>
                  <p style={{ fontSize: '11px', color: '#8E989F', margin: 0, lineHeight: 1.4 }}>
                    Crie uma sala ou digite o código de acesso para sincronizar pistas e discutir o caso com seus parceiros.
                  </p>
                  
                  <button
                    onClick={handleCreateRoom}
                    disabled={loadingLobby}
                    style={{
                      background: 'linear-gradient(90deg, #A88B63 0%, #C5A880 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#0A0D10',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} /> {loadingLobby ? 'Criando...' : 'Criar Nova Sala'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    <span style={{ fontSize: '10px', color: '#4A5568' }}>OU</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="CÓDIGO"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      maxLength={6}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '8px',
                        color: '#F8F9FA',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        letterSpacing: '2px'
                      }}
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={loadingLobby || !joinCodeInput.trim()}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#F8F9FA',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <LogIn size={14} />
                    </button>
                  </div>

                  {lobbyError && (
                    <div style={{ color: '#E53E3E', fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
                      {lobbyError}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8E989F', textTransform: 'uppercase', letterSpacing: '1px' }}>Sua Sala</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#C5A880', letterSpacing: '1px', marginTop: '2px' }}>{roomCode}</div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(roomCode || '');
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#F8F9FA',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Copiar Código"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  <div style={{ maxHeight: '120px', overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#8E989F', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Investigadores Conectados ({players.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {players.map((p: any, idx: number) => {
                        const isMe = p.anonymous_user_id === localStorage.getItem('userId');
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.connection_status === 'CONNECTED' ? '#48BB78' : '#A0AEC0' }} />
                            <span style={{ color: '#E2E8F0', fontWeight: isMe ? 600 : 400 }}>
                              {p.display_name || p.user?.default_display_name || 'Investigador'} {isMe && '(Você)'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleLeaveRoom}
                    style={{
                      background: 'rgba(229, 62, 62, 0.1)',
                      border: '1px solid rgba(229, 62, 62, 0.2)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#E53E3E',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}
                  >
                    <LogOut size={12} /> Sair da Sala
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="menu-wrapper" ref={menuRef}>
        <button
          className={`menu-button${menuOpen ? ' menu-button--active' : ''}`}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-icon-wrap" aria-hidden="true">
            <Menu size={20} strokeWidth={1.6} className={`menu-icon-hamburger${menuOpen ? ' menu-icon-hamburger--hidden' : ''}`} />
            <X size={20} strokeWidth={1.6} className={`menu-icon-x${menuOpen ? ' menu-icon-x--visible' : ''}`} />
          </span>
          {hasAny && !menuOpen && <span className="notification-dot" aria-hidden="true" />}
        </button>
        <div className={`menu-dropdown${menuOpen ? ' menu-dropdown--open' : ''}`} role="menu">
          <button className="menu-dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
            Meu perfil
          </button>
          <button className="menu-dropdown-item menu-dropdown-item--with-badge" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/messages'); }}>
            Mensagens
            {notifications.messages > 0 && (
              <span className="menu-badge">{notifications.messages > 99 ? '99+' : notifications.messages}</span>
            )}
          </button>
          <button className="menu-dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/tutorial'); }}>
            Como funciona
          </button>
        </div>
      </div>
    </header>
    <main className={`app-content ${isImmersive ? 'immersive' : ''}`}>{children}</main>
    <nav className="bottom-nav" aria-label="Navegação principal"><div className="bottom-nav-inner">
      {navItems.map(({ label, route, icon: Icon, badge }) => (
        <button
          className={`nav-item ${isActive(route) ? 'active' : ''}`}
          key={label}
          onClick={() => handleNav(route)}
        >
          <span className="nav-item-icon-wrap">
            <Icon size={19} strokeWidth={isActive(route) ? 1.8 : 1.4} />
            {badge && <span className="nav-badge" aria-label="novidade" />}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div></nav>

    {discoveredClueNotification && (
      <div style={{
        position: 'fixed',
        top: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10,13,16,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #C5A880',
        borderRadius: '12px',
        padding: '12px 24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        color: '#F8F9FA'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C5A880' }}></div>
        <div style={{ fontSize: '12px' }}>
          <strong style={{ color: '#C5A880' }}>{discoveredClueNotification.title}</strong> {discoveredClueNotification.desc}
        </div>
      </div>
    )}
  </div>;
};

export default Layout;
