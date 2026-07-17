import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Users, MessageCircle, UserRound, Menu } from 'lucide-react';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : path === 'map' ? location.pathname.includes('/cases') : location.pathname.includes(path);
  const navItems = [
    { label: 'INVESTIGAÇÃO', route: '/', icon: Home },
    { label: 'CASOS', route: 'map', icon: FolderOpen },
    { label: 'LOBBY', route: 'lobby', icon: Users },
    { label: 'MENSAGENS', route: 'messages', icon: MessageCircle },
    { label: 'PERFIL', route: 'profile', icon: UserRound },
  ];
  const handleNav = (route: string) => {
    if (route === '/') return navigate('/');
    if (route === 'map') return navigate('/cases');
    const match = location.pathname.match(/\/room\/([^/]+)/);
    navigate(match && route !== 'cases' && route !== 'profile' ? `/room/${match[1]}/${route}` : `/${route}`);
  };

  return <div className="app-shell">
    <header className="topbar">
      {location.pathname !== '/' ? (
        <button aria-label="Ir para início" onClick={() => navigate('/')} style={{ background: 'none', border: 0 }}>
          <img className="topbar-logo" src="/logo-sem-fundo.png" alt="Último Vestígio" />
        </button>
      ) : (
        <div style={{ width: '72px' }} />
      )}
      <button className="menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu size={19} strokeWidth={1.5} /><span className="notification-dot" /></button>
    </header>
    {menuOpen && <div className="quick-menu" role="dialog" aria-label="Menu rápido"><div className="quick-menu-head"><span className="eyebrow">Arquivo do investigador</span><button onClick={() => setMenuOpen(false)} aria-label="Fechar menu">Fechar</button></div><button onClick={() => { setMenuOpen(false); navigate('/tutorial'); }}>Como funciona</button><button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>Meu perfil</button><button onClick={() => { setMenuOpen(false); navigate('/messages'); }}>Mensagens da equipe</button></div>}
    <main className="app-content">{children}</main>
    <nav className="bottom-nav" aria-label="Navegação principal"><div className="bottom-nav-inner">
      {navItems.map(({ label, route, icon: Icon }) => <button className={`nav-item ${isActive(route) ? 'active' : ''}`} key={label} onClick={() => handleNav(route)}>
        <Icon size={19} strokeWidth={isActive(route) ? 1.8 : 1.4} /><span>{label}</span>
      </button>)}
    </div></nav>
  </div>;
};

export default Layout;
