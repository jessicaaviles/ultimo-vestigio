import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Users, MessageCircle, UserRound, Menu, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleNav = (route: string) => {
    if (route === '/') return navigate('/');
    if (route === 'map') return navigate('/cases');
    const match = location.pathname.match(/\/room\/([^/]+)/);
    navigate(match && route !== 'cases' && route !== 'profile' ? `/room/${match[1]}/${route}` : `/${route}`);
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

  return <div className="app-shell">
    <header className="topbar">
      {location.pathname !== '/' ? (
        <button aria-label="Ir para início" onClick={() => navigate('/')} style={{ background: 'none', border: 0 }}>
          <img className="topbar-logo" src="/logo-sem-fundo.png" alt="Último Vestígio" />
        </button>
      ) : (
        <div style={{ width: '72px' }} />
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
    <main className="app-content">{children}</main>
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
  </div>;
};

export default Layout;
