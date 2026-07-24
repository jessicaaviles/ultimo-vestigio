import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Target, ArrowUpRight, Clock3, Users
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

type IdentityKind = 'guest' | 'local' | 'account';

const defaultCases: FeaturedCase[] = [
  {
    title: 'O Segredo de Blackwell House',
    subtitle: 'Mansão Blackwell · Exploração imersiva',
    level: 'Médio',
    image: '/capa_blackwell_house.png',
    description: 'Clara Mendes desapareceu. Entre na mansão, conecte as pistas e descubra quem está mentindo.',
    slug: 'blackwell',
    duration: '30 min',
    players: '1-6 jogadores'
  },
  {
    title: 'O Quarto 7',
    subtitle: 'Hotel Vesper · Mistério clássico',
    level: 'Fácil',
    image: '/capa_quarto_7.png',
    description: 'Uma chave, uma câmera e a última noite de Helena Duarte.',
    slug: 'o-quarto-7',
    duration: '45 min',
    players: '1-4 jogadores'
  },
  {
    title: 'O Presente Desaparecido',
    subtitle: 'Arquivo municipal · Linha do tempo',
    level: 'Médio',
    image: '/backgrounds/cena-do-crime.png',
    description: 'Durante uma comemoração, um presente desaparece sem deixar rastros.',
    slug: 'o-presente-desaparecido',
    duration: '30 min',
    players: '2-6 jogadores'
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [displayName, setDisplayName] = useState<string>('Investigador');
  const [identityKind, setIdentityKind] = useState<IdentityKind>('guest');
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [featuredCases, setFeaturedCases] = useState<FeaturedCase[]>(defaultCases);
  
  const activeRoomId = localStorage.getItem('currentRoomId');
  const hasActiveCase = !!activeRoomId;

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const deviceToken = localStorage.getItem('deviceToken');
    const userId = localStorage.getItem('userId');
    const savedName = localStorage.getItem('userName');

    const applyProfile = (profile: any, kind: IdentityKind) => {
      const profileName = profile?.displayName;
      if (profileName) {
        setDisplayName(profileName);
        localStorage.setItem('userName', profileName);
      } else {
        setDisplayName('Investigador');
      }
      setIdentityKind(kind);
    };

    if (authToken && userId) {
      setIdentityKind('account');
      if (savedName) setDisplayName(savedName);
      getProfile(userId)
        .then((res) => {
          if (res.success) applyProfile(res.data, 'account');
        })
        .catch(() => undefined);
      return;
    }

    if (deviceToken && userId) {
      if (savedName) {
        setDisplayName(savedName);
        setIdentityKind('local');
      }
      getProfile(userId)
        .then((res) => {
          if (!res.success) return;
          const hasLocalProfile = Boolean(res.data?.hasProfile);
          applyProfile(res.data, hasLocalProfile ? 'local' : 'guest');
        })
        .catch(() => undefined);
      return;
    }

    setDisplayName('Investigador');
    setIdentityKind('guest');
    localStorage.removeItem('userName');

    if (!deviceToken || !userId) {
      setRegistering(true);
      registerAnonymousUser()
        .then((res) => {
          if (res.success) {
            localStorage.setItem('deviceToken', res.data.deviceToken);
            localStorage.setItem('userId', res.data.userId);
            if (res.data.displayName) {
              setDisplayName(res.data.displayName);
              setIdentityKind('local');
              localStorage.setItem('userName', res.data.displayName);
            }
          }
        })
        .catch(() => undefined)
        .finally(() => setRegistering(false));
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
          const mapped: FeaturedCase[] = res.data.slice(0, 3).map((item: any) => {
            const img = item.cover_image_data || fallbackImages[item.slug] || '/backgrounds/mapa-da-investigacao.png';
            return {
              title: item.title,
              subtitle: item.slug === 'blackwell' ? 'Modo Imersivo · Protótipo 3D' : (item.slug === 'o-quarto-7' ? 'Hotel Vesper · Mistério Clássico' : 'Arquivo Municipal · Dedução'),
              level: item.difficulty || 'Fácil',
              image: img,
              description: item.short_synopsis || item.synopsis || 'Analise todas as evidências e encontre a verdade.',
              slug: item.slug,
              duration: item.slug === 'blackwell' ? '30 min' : '45 min',
              players: '1-6 Jogadores'
            };
          });
          setFeaturedCases(mapped);
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
  const identityLabel = {
    guest: 'Visitante',
    local: 'Perfil local neste dispositivo',
    account: 'Conta sincronizada'
  }[identityKind];

  return (
    <div className="home-immersive-container">
      
      {/* Imagem de Fundo Estática para evitar conflitos de carregamento */}
      <div 
        className="home-bg" 
        style={{ backgroundImage: `url("/backgrounds/map_blackwell.png")` }}
      />
      
      <div className="home-content-wrapper">
        
        {/* Cabeçalho do Perfil */}
        <header className="home-profile-header">
          <div className="avatar-container" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src="/backgrounds/helena_portrait.png" alt="" className="avatar-img" />
            <div className="level-badge">{solvedCount * 2 + 1}</div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{displayName}</h1>
            <span className="profile-role">{rank}</span>
            <span className={`profile-session profile-session--${identityKind}`}>{identityLabel}</span>
          </div>
        </header>

        {registering && (
          <div style={{ marginBottom: '20px' }}>
            <Loading small message="Conectando aos servidores..." />
          </div>
        )}

        {/* Hero: Caso Fixo */}
        <section className="home-hero-section">
          <img
            src="/logo-sem-fundo.png"
            alt="Último Vestígio"
            className="home-hero-brand"
          />
          <span className="hero-tag">{hasActiveCase ? 'CASO ATIVO' : 'CASO EM DESTAQUE'}</span>
          <h2 className="home-hero-title">O Segredo de Blackwell House</h2>
          <p className="home-hero-subtitle">
            Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell. Analise todas as evidências e encontre a verdade.
          </p>
          <div className="home-hero-details" aria-label="Detalhes do caso">
            <span><Clock3 size={15} /> Cerca de 30 min</span>
            <span><Users size={15} /> 1 a 6 investigadores</span>
            <span className="home-hero-difficulty">Dificuldade média</span>
          </div>
          <button 
            className="btn-pill"
            onClick={() => navigate(hasActiveCase ? `/room/${activeRoomId}/game` : '/cases')}
          >
            {hasActiveCase ? 'Continuar investigação' : 'Explorar casos'}
            <div className="btn-pill-icon">
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          </button>
        </section>

        {/* Estatísticas do Jogador */}
        <section className="home-section">
          <div className="home-section-heading">
            <h3 className="section-title">Seu histórico na agência</h3>
          </div>
          
          {solvedCount === 0 ? (
            <div className="home-empty-stats">
              <div className="home-empty-stats-icon">
                <Target size={32} />
              </div>
              <div className="home-empty-stats-copy">
                <h4>Seu primeiro caso espera por você</h4>
                <p>
                  Conclua uma investigação para registrar sua precisão, tempo em campo e subir de patente na agência.
                </p>
              </div>
              <button className="btn-secondary home-empty-stats-action" onClick={() => navigate('/cases')}>
                Escolher caso
              </button>
            </div>
          ) : (
            <div className="home-stats-grid">
              <div className="home-stat-box">
                <div className="home-stat-value">{solvedCount}</div>
                <div className="home-stat-label">Casos Resolvidos</div>
              </div>
              <div className="home-stat-box">
                <div className="home-stat-value">94%</div>
                <div className="home-stat-label">Precisão Teórica</div>
              </div>
              <div className="home-stat-box">
                <div className="home-stat-value">{solvedCount * 2.5}h</div>
                <div className="home-stat-label">Tempo em Campo</div>
              </div>
              <div className="home-stat-box">
                <div className="home-stat-value">01</div>
                <div className="home-stat-label">Temporada Ativa</div>
              </div>
            </div>
          )}
        </section>

        {/* Investigações em Destaque (Carrossel) */}
        <section className="home-section home-featured-section">
          <div className="home-featured-heading">
            <div>
              <span className="mission-label">Arquivo municipal</span>
              <h2>Escolha sua próxima investigação</h2>
              <p>Casos com diferentes ritmos, cenários e níveis de desafio.</p>
            </div>
            <button 
              className="home-view-all"
              onClick={() => navigate('/cases')}
            >
              Ver todos <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="featured-carousel">
            {featuredCases.map((item, index) => (
              <button key={item.slug} className="featured-card" onClick={() => navigate('/cases')} aria-label={`Abrir caso ${item.title}`}>
                <div className="featured-card-image" style={{ backgroundImage: `url("${item.image}")` }}>
                  <div className="featured-card-overlay">
                    <span className="featured-card-number">0{index + 1}</span>
                    <span className="badge-difficulty badge-easy" style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--paper)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {item.level}
                    </span>
                  </div>
                </div>
                <div className="featured-card-content">
                  <h3 className="featured-card-title">{item.title}</h3>
                  <span className="featured-card-subtitle">{item.subtitle}</span>
                  <p className="featured-card-desc">{item.description}</p>
                  <div className="featured-card-meta">
                    <span><Clock3 size={14} /> {item.duration}</span>
                    <span><Users size={14} /> {item.players}</span>
                  </div>
                  <span className="featured-card-action">
                    Ver dossiê <ArrowRight size={15} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
