import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Target, ArrowUpRight, Clock3, Users
} from 'lucide-react';
import { registerAnonymousUser, listCases, getProfile } from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';

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

interface InvestigatorStats {
  hostedRoomsCount: number;
  playedRoomsCount: number;
  theoriesCount: number;
  correctTheoriesCount: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState(false);
  const [profileStats, setProfileStats] = useState<InvestigatorStats | null>(null);
  const [solvedCount, setSolvedCount] = useState<number | null>(null);
  const [featuredCases, setFeaturedCases] = useState<FeaturedCase[]>([]);
  
  const activeRoomId = localStorage.getItem('currentRoomId');
  const hasActiveCase = !!activeRoomId;

  useEffect(() => {
    const deviceToken = localStorage.getItem('deviceToken');
    const userId = localStorage.getItem('userId');

    if (userId) {
      getProfile(userId)
        .then((res) => {
          if (res.success) setProfileStats(res.data?.stats || null);
        })
        .catch(() => undefined)
        .finally(() => setProfileLoading(false));
      return;
    }

    localStorage.removeItem('userName');
    setProfileLoading(false);

    if (!deviceToken || !userId) {
      registerAnonymousUser()
        .then((res) => {
          if (res.success) {
            localStorage.setItem('deviceToken', res.data.deviceToken);
            localStorage.setItem('userId', res.data.userId);
            void refresh();
          }
        })
        .catch(() => undefined);
    }
  }, [refresh]);

  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    setCasesError(false);
    const userId = localStorage.getItem('userId');
    try {
      const res: any = await listCases(userId);
      if (!res.success || !Array.isArray(res.data)) throw new Error('Invalid cases response');

      setSolvedCount(Array.isArray(res.solvedSlugs) ? res.solvedSlugs.length : 0);
      setFeaturedCases(res.data.slice(0, 3).map((item: any) => {
        const minPlayers = Number(item.min_players) || 1;
        const maxPlayers = Number(item.max_players) || minPlayers;
        const players = minPlayers === maxPlayers
          ? `${minPlayers} jogador${minPlayers > 1 ? 'es' : ''}`
          : `${minPlayers}-${maxPlayers} jogadores`;
        return {
          title: item.title,
          subtitle: item.case_type || 'Investigação',
          level: item.difficulty || 'Não informada',
          image: item.cover_image_data || fallbackImages[item.slug] || '/backgrounds/mapa-da-investigacao.png',
          description: item.short_synopsis || item.synopsis || 'Sinopse não disponível.',
          slug: item.slug,
          duration: item.estimated_duration_minutes ? `${item.estimated_duration_minutes} min` : 'Não informada',
          players
        };
      }));
    } catch {
      setSolvedCount(null);
      setFeaturedCases([]);
      setCasesError(true);
    } finally {
      setCasesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const totalPlayed = profileStats?.playedRoomsCount ?? 0;
  const theoriesCount = profileStats?.theoriesCount ?? 0;
  const theoryAccuracy = theoriesCount > 0
    ? Math.round(((profileStats?.correctTheoriesCount ?? 0) / theoriesCount) * 100)
    : null;
  const hasInvestigationHistory = (solvedCount ?? 0) > 0 || totalPlayed > 0 || theoriesCount > 0;

  return (
    <div className="home-immersive-container">
      
      {/* Imagem de Fundo Estática para evitar conflitos de carregamento */}
      <div 
        className="home-bg" 
        style={{ backgroundImage: `url("/backgrounds/map_blackwell.png")` }}
      />
      
      <div className="home-content-wrapper">
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
          
          {casesLoading || profileLoading ? (
            <div className="home-loading-panel" aria-busy="true">
              <Loading message="Consultando seu histórico..." fullPage={false} />
            </div>
          ) : casesError ? (
            <div className="home-data-state" role="status">
              <p>Seu histórico não pôde ser consultado agora.</p>
              <button className="btn-secondary" onClick={loadCases}>Tentar novamente</button>
            </div>
          ) : !hasInvestigationHistory ? (
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
                <div className="home-stat-label">Casos resolvidos</div>
              </div>
              {profileStats && (
                <>
                  <div className="home-stat-box">
                    <div className="home-stat-value">{totalPlayed}</div>
                    <div className="home-stat-label">Investigações jogadas</div>
                  </div>
                  <div className="home-stat-box">
                    <div className="home-stat-value">{theoriesCount}</div>
                    <div className="home-stat-label">Teorias registradas</div>
                  </div>
                  <div className="home-stat-box">
                    <div className="home-stat-value">{theoryAccuracy === null ? '—' : `${theoryAccuracy}%`}</div>
                    <div className="home-stat-label">Precisão das teorias</div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Investigações em Destaque (Carrossel) */}
        <section className="home-section home-featured-section">
          <div className="home-featured-heading">
            <div>
              <span className="mission-label">Casos disponíveis</span>
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

          {casesLoading ? (
            <div className="home-loading-panel home-loading-panel--cases" aria-busy="true">
              <Loading message="Consultando o arquivo de casos..." fullPage={false} />
            </div>
          ) : casesError ? (
            <div className="home-data-state" role="alert">
              <p>Não foi possível carregar as investigações.</p>
              <button className="btn-secondary" onClick={loadCases}>Tentar novamente</button>
            </div>
          ) : featuredCases.length === 0 ? (
            <div className="home-data-state">
              <p>Nenhuma investigação está disponível neste momento.</p>
            </div>
          ) : (
            <div className="featured-carousel">
              {featuredCases.map((item, index) => (
                <button key={item.slug} className="featured-card" onClick={() => navigate('/cases')} aria-label={`Abrir caso ${item.title}`}>
                  <div className="featured-card-image" style={{ backgroundImage: `url("${item.image}")` }}>
                    <div className="featured-card-overlay">
                      <span className="featured-card-number">0{index + 1}</span>
                      <span className="featured-card-tag">
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
          )}
        </section>

      </div>
    </div>
  );
};

export default Home;
