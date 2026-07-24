import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Users, Play, Target, Clock
} from 'lucide-react';
import { registerAnonymousUser, listCases, getProfile } from '../services/api';
import Loading from '../components/Loading';

const fallbackImages: Record<string, string> = {
  'blackwell': '/backgrounds/map_blackwell.png',
  'o-quarto-7': '/capa_quarto_7.png',
  'o-presente-desaparecido': '/backgrounds/cena-do-crime.png',
};

interface FeaturedCase {
  title: string;
  subtitle: string;
  level: string;
  image: string;
  description: string;
  slug: string;
  duration: string;
  players: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [displayName, setDisplayName] = useState<string>('Investigador');
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [activeCase, setActiveCase] = useState<FeaturedCase | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('deviceToken');
    const userId = localStorage.getItem('userId');
    const savedName = localStorage.getItem('userName');
    
    if (savedName) {
      setDisplayName(savedName);
    }

    if (!token || !userId) {
      setRegistering(true);
      registerAnonymousUser()
        .then((res) => {
          if (res.success) {
            localStorage.setItem('deviceToken', res.data.deviceToken);
            localStorage.setItem('userId', res.data.userId);
            if (res.data.displayName) {
              setDisplayName(res.data.displayName);
              localStorage.setItem('userName', res.data.displayName);
            }
          }
        })
        .catch(() => undefined)
        .finally(() => setRegistering(false));
    } else {
      getProfile(userId)
        .then((res) => {
          if (res.success && res.data?.display_name) {
            setDisplayName(res.data.display_name);
            localStorage.setItem('userName', res.data.display_name);
          }
        })
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    listCases(userId)
      .then((res: any) => {
        if (res.solvedSlugs) {
          setSolvedCount(res.solvedSlugs.length);
        }
        
        if (res.success && res.data?.length) {
          const item = res.data.find((c: any) => c.slug === 'blackwell') || res.data[0];
          const img = item.cover_image_data || fallbackImages[item.slug] || '/backgrounds/mapa-da-investigacao.png';
          setActiveCase({
            title: item.title,
            subtitle: item.slug === 'blackwell' ? 'Modo Imersivo · Protótipo 3D' : 'Arquivo Municipal · Dedução',
            level: item.difficulty || 'Média',
            image: img,
            description: item.short_synopsis || item.synopsis || 'Analise todas as evidências e encontre a verdade.',
            slug: item.slug,
            duration: item.slug === 'blackwell' ? '30 min' : '45 min',
            players: '1-6 Jogadores'
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const getInvestigatorRank = (count: number) => {
    if (count === 0) return 'Recruta Forense';
    if (count === 1) return 'Detetive de Campo';
    if (count === 2) return 'Perito Criminal';
    return 'Agente Especial';
  };

  const rank = getInvestigatorRank(solvedCount);

  return (
    <div className="home-immersive-container">
      
      {/* Imagem de Fundo (Full Bleed) */}
      <div 
        className="home-bg" 
        style={{ backgroundImage: `url("${activeCase?.image || fallbackImages['blackwell']}")` }}
      />
      
      <div className="home-content-wrapper">
        
        {/* Cabeçalho do Perfil - Posicionado na esquerda, abaixo da safe-area */}
        <header className="home-profile-header">
          <div className="avatar-container" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src="/helena_portrait.png" alt="Avatar" className="avatar-img" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + displayName + '&background=1f2a30&color=d1bb86'; }} />
            <div className="level-badge">{solvedCount * 2 + 1}</div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{displayName}</h1>
            <span className="profile-role">{rank}</span>
          </div>
        </header>

        {registering && (
          <div style={{ marginBottom: '20px' }}>
            <Loading small message="Conectando aos servidores..." />
          </div>
        )}

        {/* Hero: Caso Ativo */}
        <section className="home-hero-section">
          <span className="hero-tag">Caso Ativo</span>
          <h2 className="home-hero-title">{activeCase?.title || 'O Segredo de Blackwell House'}</h2>
          <p className="home-hero-subtitle">
            {activeCase?.description || 'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell. Analise todas as evidências e encontre a verdade.'}
          </p>
          <button 
            className="btn-pill"
            onClick={() => navigate(activeCase?.slug ? `/cases` : '/cases')}
          >
            Continuar investigação
            <div className="btn-pill-icon">
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          </button>
        </section>

        {/* Card: Missão da Semana */}
        <section className="weekly-mission-card">
          <div className="weekly-mission-content">
            <span className="mission-label">Missão da Semana</span>
            <h3 className="mission-title">Verdade nos Detalhes</h3>
            <div className="mission-timer">
              <Clock size={14} /> Expira em 5d 12h
            </div>
          </div>
          <div className="mission-image" style={{ backgroundImage: 'url("/capa_quarto_7.png")' }} />
        </section>

        {/* Modos de Jogo */}
        <section>
          <h3 className="section-title">Escolha como jogar</h3>
          <div className="game-modes-grid">
            
            <div className="game-mode-card" style={{ backgroundImage: 'url("/backgrounds/cena-do-crime.png")' }} onClick={() => navigate('/cases')}>
              <div className="mode-card-overlay">
                <div className="mode-icon-top">
                  <Target size={18} />
                </div>
                <div className="mode-info">
                  <span className="mode-title">Jogar Sozinho</span>
                  <span className="mode-desc">Desvende os mistérios por conta própria.</span>
                </div>
                <div className="mode-action-btn">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>

            <div className="game-mode-card" style={{ backgroundImage: 'url("/equipe-investigadores.png")' }} onClick={() => navigate('/join')}>
              <div className="mode-card-overlay">
                <div className="mode-icon-top">
                  <Users size={18} />
                </div>
                <div className="mode-info">
                  <span className="mode-title">Multiplayer</span>
                  <span className="mode-desc">Investigue em equipe com amigos.</span>
                </div>
                <div className="mode-action-btn">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>

            <div className="game-mode-card" style={{ backgroundImage: 'url("/backgrounds/mapa-da-investigacao.png")' }} onClick={() => navigate('/cases')}>
              <div className="mode-card-overlay">
                <div className="mode-icon-top">
                  <Play size={18} />
                </div>
                <div className="mode-info">
                  <span className="mode-title">Partida Rápida</span>
                  <span className="mode-desc">Casos curtos de dedução rápida.</span>
                </div>
                <div className="mode-action-btn">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
