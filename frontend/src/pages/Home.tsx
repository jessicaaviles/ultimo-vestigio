import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Target, ArrowUpRight, Clock3, Users, Trophy, FileText, Crosshair
} from 'lucide-react';
import { registerAnonymousUser, listCases, getProfile } from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';

const fallbackImages: Record<string, string> = {
  'blackwell': '/backgrounds/map_blackwell.png',
  'a-heranca-de-vidro': '/capa_heranca_de_vidro.png',
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

interface ActiveInvestigation {
  roomId: string;
  status: string;
  case: FeaturedCase;
}

interface InvestigatorStats {
  hostedRoomsCount: number;
  playedRoomsCount: number;
  theoriesCount: number;
  correctTheoriesCount: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState(false);
  const [profileStats, setProfileStats] = useState<InvestigatorStats | null>(null);
  const [solvedCount, setSolvedCount] = useState<number | null>(null);
  const [featuredCases, setFeaturedCases] = useState<FeaturedCase[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<ActiveInvestigation | null>(null);
  
  const mapCase = useCallback((item: any): FeaturedCase => {
    const minPlayers = Number(item.min_players) || 1;
    const maxPlayers = Number(item.max_players) || minPlayers;
    const players = minPlayers === maxPlayers
      ? `${minPlayers} jogador${minPlayers > 1 ? 'es' : ''}`
      : `${minPlayers}-${maxPlayers} jogadores`;

    return {
      title: item.title,
      subtitle: item.case_type || 'Investigação',
      level: item.difficulty || 'Não informada',
      image: item.slug === 'blackwell'
        ? fallbackImages.blackwell
        : item.cover_image_data || fallbackImages[item.slug] || '/backgrounds/mapa-da-investigacao.png',
      description: item.short_synopsis || item.synopsis || 'Sinopse não disponível.',
      slug: item.slug,
      duration: item.estimated_duration_minutes ? `${item.estimated_duration_minutes} min` : 'Não informada',
      players
    };
  }, []);

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
    const userId = user?.userId || localStorage.getItem('userId');
    try {
      const res: any = await listCases(userId);
      if (!res.success || !Array.isArray(res.data)) throw new Error('Invalid cases response');

      const solvedSlugs = Array.isArray(res.solvedSlugs) ? res.solvedSlugs : [];
      const activeStatus = String(res.activeRoom?.status || '');
      const activeStatuses = new Set(['IN_PROGRESS', 'PAUSED', 'SOLVING', 'REVEAL']);
      const active = res.activeRoom?.roomId && res.activeRoom?.case && activeStatuses.has(activeStatus)
        ? {
            roomId: String(res.activeRoom.roomId),
            status: activeStatus,
            case: mapCase(res.activeRoom.case)
          }
        : null;

      setSolvedCount(solvedSlugs.length);
      setActiveInvestigation(active);
      setFeaturedCases(
        res.data
          .filter((item: any) => !solvedSlugs.includes(item.slug) && item.slug !== active?.case.slug)
          .slice(0, 3)
          .map(mapCase)
      );

      localStorage.setItem('solvedCases', JSON.stringify(solvedSlugs));
      if (active) {
        localStorage.setItem('currentRoomId', active.roomId);
      } else if (userId) {
        localStorage.removeItem('currentRoomId');
        localStorage.removeItem('currentRoomCode');
      }
    } catch {
      setSolvedCount(null);
      setFeaturedCases([]);
      setActiveInvestigation(null);
      setCasesError(true);
    } finally {
      setCasesLoading(false);
    }
  }, [mapCase, user?.userId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const totalPlayed = profileStats?.playedRoomsCount ?? 0;
  const theoriesCount = profileStats?.theoriesCount ?? 0;
  const theoryAccuracy = theoriesCount > 0
    ? Math.round(((profileStats?.correctTheoriesCount ?? 0) / theoriesCount) * 100)
    : null;
  const hasInvestigationHistory = (solvedCount ?? 0) > 0 || totalPlayed > 0 || theoriesCount > 0;
  const heroCase = activeInvestigation?.case;
  const heroImage = heroCase?.image || '/backgrounds/map_blackwell.png';
  const activeDestination = activeInvestigation?.status === 'LOBBY'
    ? `/room/${activeInvestigation.roomId}/lobby`
    : activeInvestigation
      ? `/room/${activeInvestigation.roomId}/game`
      : '/cases';
  const homeStatCards = [
    {
      label: 'Casos resolvidos',
      value: solvedCount ?? 0,
      detail: `${Math.min(5, Math.max(0, solvedCount ?? 0))} / 5 marcos`,
      level: (solvedCount ?? 0) > 0 ? `LV.${Math.min(5, Math.max(1, solvedCount ?? 0))}` : 'LV.0',
      Icon: Trophy,
      tone: 'gold'
    },
    {
      label: 'Investigações jogadas',
      value: totalPlayed,
      detail: `${Math.min(10, totalPlayed)} / 10 sessões`,
      level: totalPlayed > 0 ? `LV.${Math.min(5, Math.ceil(totalPlayed / 2))}` : 'LV.0',
      Icon: Users,
      tone: 'olive'
    },
    {
      label: 'Teorias registradas',
      value: theoriesCount,
      detail: `${Math.min(12, theoriesCount)} / 12 teorias`,
      level: theoriesCount > 0 ? `LV.${Math.min(5, Math.ceil(theoriesCount / 3))}` : 'LV.0',
      Icon: FileText,
      tone: 'blue'
    },
    {
      label: 'Precisão das teorias',
      value: theoryAccuracy === null ? '—' : `${theoryAccuracy}%`,
      detail: theoriesCount > 0 ? `${profileStats?.correctTheoriesCount ?? 0} acertos` : 'Sem teorias',
      level: theoryAccuracy === null ? 'Sem dados' : theoryAccuracy >= 80 ? 'Perícia alta' : theoryAccuracy >= 50 ? 'Em evolução' : 'Calibrando',
      Icon: Crosshair,
      tone: 'wine'
    },
  ];

  return (
    <div className="home-immersive-container">
      
      {/* Fundo do caso ativo; Blackwell permanece como fallback */}
      <div 
        className="home-bg" 
        style={{ backgroundImage: `url("${heroImage}")` }}
      />
      
      <div className="home-content-wrapper">
        {/* Hero: investigação ativa ou caso Blackwell como fallback */}
        <section className="home-hero-section" aria-busy={casesLoading}>
          <img
            src="/logo-sem-fundo.png"
            alt="Último Vestígio"
            className="home-hero-brand"
          />
          {casesLoading ? (
            <div className="home-hero-loading" aria-label="Carregando investigação em destaque">
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            <>
              <span className="hero-tag">{activeInvestigation ? 'CASO EM ANDAMENTO' : 'CASO EM DESTAQUE'}</span>
              <div className="home-hero-text">
                <h2 className="home-hero-title">{heroCase?.title || 'O Segredo de Blackwell House'}</h2>
                <p className="home-hero-subtitle">
                  {heroCase?.description || 'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell. Analise todas as evidências e encontre a verdade.'}
                </p>
              </div>
              <div className="home-hero-details" aria-label="Detalhes do caso">
                <span><Clock3 size={15} /> {heroCase ? heroCase.duration : 'Cerca de 30 min'}</span>
                <span><Users size={15} /> {heroCase ? heroCase.players : '1 a 6 investigadores'}</span>
                <span className="home-hero-difficulty">Dificuldade {heroCase?.level.toLocaleLowerCase('pt-BR') || 'média'}</span>
              </div>
              <button
                className="btn-pill"
                onClick={() => navigate(activeDestination)}
              >
                {activeInvestigation ? 'Continuar investigação' : 'Explorar casos'}
                <div className="btn-pill-icon">
                  <ArrowRight size={16} strokeWidth={2.5} />
                </div>
              </button>
            </>
          )}
        </section>

        {/* Estatísticas do Jogador */}
        <section className="home-section">
          <div className="home-section-heading">
            <span className="eyebrow">Suas estatísticas</span>
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
              {homeStatCards.map(({ label, value, detail, level, Icon, tone }) => (
                <div className="home-stat-box home-stat-box--badge" key={label}>
                  <div className={`home-stat-badge home-stat-badge--${tone}`} aria-hidden="true">
                    <Icon size={23} strokeWidth={1.8} />
                  </div>
                  <div className="home-stat-level">{level}</div>
                  <div className="home-stat-value">{value}</div>
                  <div className="home-stat-label">{label}</div>
                  <div className="home-stat-detail">{detail}</div>
                </div>
              ))}
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
              <p>
                {activeInvestigation
                  ? 'Sua próxima investigação aparecerá aqui quando o caso atual for concluído.'
                  : 'Você já resolveu todos os casos disponíveis. Novas investigações aparecerão aqui.'}
              </p>
            </div>
          ) : (
            <div className="featured-carousel">
              {featuredCases.map((item, index) => (
                <button key={item.slug} className="featured-card" onClick={() => navigate(`/cases?case=${encodeURIComponent(item.slug)}`)} aria-label={`Abrir caso ${item.title}`}>
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
                      Jogar esse caso <ArrowRight size={15} />
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
