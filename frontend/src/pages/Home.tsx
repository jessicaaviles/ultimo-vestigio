import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Users, Play, Target, Clock, ArrowUpRight
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
  const [featuredCases, setFeaturedCases] = useState<FeaturedCase[]>([]);
  
  const activeRoomId = localStorage.getItem('currentRoomId');
  const hasActiveCase = !!activeRoomId;

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
      .catch(() => {
        setFeaturedCases([
          { title: 'O Quarto 7', subtitle: 'Hotel Vesper · Mistério Clássico', level: 'Fácil', image: '/capa_quarto_7.png', description: 'Uma chave, uma câmera e a última noite de Helena Duarte.', slug: 'o-quarto-7', duration: '45 min', players: '1-4 Jogadores' },
          { title: 'O Presente Desaparecido', subtitle: 'Arquivo · Linha do Tempo', level: 'Médio', image: '/backgrounds/cena-do-crime.png', description: 'Durante uma comemoração, um presente desaparece misteriosamente.', slug: 'o-presente-desaparecido', duration: '30 min', players: '2-6 Jogadores' }
        ]);
      });
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
      
      {/* Imagem de Fundo Estática para evitar conflitos de carregamento */}
      <div 
        className="home-bg" 
        style={{ backgroundImage: `url("/backgrounds/map_blackwell.png")` }}
      />
      
      <div className="home-content-wrapper">
        
        {/* Cabeçalho do Perfil */}
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

        {/* Hero: Caso Fixo */}
        <section className="home-hero-section">
          <span className="hero-tag">CASO ATIVO</span>
          <h2 className="home-hero-title">O Segredo de Blackwell House</h2>
          <p className="home-hero-subtitle">
            Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell. Analise todas as evidências e encontre a verdade.
          </p>
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
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Estatísticas Oficiais</h3>
          </div>
          
          {solvedCount === 0 ? (
            <div className="home-stat-box" style={{ marginBottom: '40px', padding: '30px 20px', flexDirection: 'row', gap: '20px', textAlign: 'left', alignItems: 'center' }}>
              <div style={{ background: 'rgba(197, 168, 128, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--gold-soft)' }}>
                <Target size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--paper)', fontSize: '18px', fontFamily: 'var(--font-serif)', margin: '0 0 8px 0' }}>Seu registro está limpo</h4>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  Você acaba de ser admitido na agência. Complete casos para subir de patente e registrar suas estatísticas forenses aqui.
                </p>
              </div>
              <button className="btn-secondary" onClick={() => navigate('/cases')} style={{ borderRadius: '8px', minHeight: '40px', padding: '0 16px', fontSize: '12px' }}>
                Começar
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
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <span className="mission-label" style={{ marginBottom: '4px' }}>Arquivo Municipal</span>
              <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', color: 'var(--paper)', margin: 0 }}>
                Investigações em destaque
              </h2>
            </div>
            <button 
              onClick={() => navigate('/cases')}
              style={{ background: 'transparent', border: 'none', color: 'var(--gold-soft)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Ver Todas <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="featured-carousel">
            {featuredCases.map((item, index) => (
              <div key={item.slug} className="featured-card" onClick={() => navigate('/cases')}>
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
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
