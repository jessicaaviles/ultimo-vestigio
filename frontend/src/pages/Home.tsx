import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, Shield, Award, FolderOpen, Play, 
  Bot, Compass, Users, LayoutGrid, Sparkles, Clock, Target, Flame
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
  
  // Recuperar sala ativa do localStorage
  const activeRoomId = localStorage.getItem('currentRoomId');
  const activeRoomCode = localStorage.getItem('currentRoomCode');

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
        
        if (!res.success || !res.data?.length) {
          setFeaturedCases([
            { title: 'Mansão Blackwell', subtitle: 'Modo Imersivo · Protótipo 3D', level: 'Médio', image: '/backgrounds/map_blackwell.png', description: 'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell.', slug: 'blackwell', duration: '30 min', players: '1-4 Jogadores' },
            { title: 'O Quarto 7', subtitle: 'Hotel Vesper · Mistério clássico', level: 'Fácil', image: '/capa_quarto_7.png', description: 'Uma chave, uma câmera e a última noite de Helena Duarte.', slug: 'o-quarto-7', duration: '45 min', players: '2-6 Jogadores' },
          ]);
          return;
        }
        
        const mapped: FeaturedCase[] = res.data.slice(0, 3).map((item: any) => {
          const img = item.cover_image_data || fallbackImages[item.slug] || '/backgrounds/mapa-da-investigacao.png';
          return {
            title: item.title,
            subtitle: item.slug === 'blackwell' ? 'Modo Imersivo · Protótipo 3D' : 'Arquivo Municipal · Dedução',
            level: item.difficulty || 'Média',
            image: img,
            description: item.short_synopsis || item.synopsis || 'Analise todas as evidências e encontre a verdade.',
            slug: item.slug,
            duration: item.slug === 'blackwell' ? '30 min' : '45 min',
            players: '1-6 Jogadores'
          };
        });
        setFeaturedCases(mapped);
      })
      .catch(() => {
        setFeaturedCases([
          { title: 'Mansão Blackwell', subtitle: 'Modo Imersivo · Protótipo 3D', level: 'Médio', image: '/backgrounds/map_blackwell.png', description: 'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell.', slug: 'blackwell', duration: '30 min', players: '1-4 Jogadores' },
          { title: 'O Quarto 7', subtitle: 'Hotel Vesper · Mistério clássico', level: 'Fácil', image: '/capa_quarto_7.png', description: 'Uma chave, uma câmera e a última noite de Helena Duarte.', slug: 'o-quarto-7', duration: '45 min', players: '2-6 Jogadores' },
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
    <div className="home route-page" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* 1. HERO BANNER CINEMATOGRÁFICO COM IMAGEM DE FUNDO */}
      <section className="hero-cinematic" style={{ backgroundImage: 'url("/backgrounds/mapa-da-investigacao.png")' }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="system-status-bar">
            <span className="status-pulse" />
            <span>SISTEMA FORENSE OPERACIONAL · TEMPORADA 01</span>
          </div>

          <img className="home-hero-logo" src="/logo-sem-fundo.png" alt="Último Vestígio" style={{ maxHeight: '90px', margin: '0 auto 20px auto', display: 'block', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))' }} />
          
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1, margin: '0 0 16px 0', fontFamily: 'var(--font-serif)', color: '#F8F9FA', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
            A Verdade Está nos Detalhes.
          </h1>
          
          <p style={{ color: '#C5C9CC', fontSize: '16px', maxWidth: '580px', margin: '0 auto 36px auto', fontWeight: 300, lineHeight: 1.6, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
            Analise cenas de crimes minuciosas, interrogue IA avançada em tempo real e conecte os vestígios para desvendar casos desafiadores.
          </p>

          <div className="home-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/cases')} 
              style={{ minHeight: '52px', padding: '0 32px', fontSize: '14px', borderRadius: '10px', boxShadow: '0 8px 25px rgba(184,153,83,0.3)' }}
            >
              Explorar Dossiês <ArrowUpRight size={18} />
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/join')} 
              style={{ minHeight: '52px', padding: '0 28px', fontSize: '14px', borderRadius: '10px', backdropFilter: 'blur(10px)', background: 'rgba(10, 13, 16, 0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Entrar com Código
            </button>
          </div>

          {registering && (
            <div style={{ marginTop: '20px' }}>
              <Loading small message="Criando seu crachá de acesso..." />
            </div>
          )}
        </div>
      </section>

      {/* 2. GRID PRINCIPAL: DOSSIÊ DO INVESTIGADOR E STATUS ATUAL */}
      <div className="dashboard-grid">
        
        {/* Card Dossiê do Agente */}
        <div className="dashboard-card" style={{ background: 'linear-gradient(145deg, rgba(25, 33, 38, 0.7) 0%, rgba(15, 20, 23, 0.85) 100%)', border: '1px solid rgba(197, 168, 128, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(197,168,128,0.12)', border: '2px solid var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(197,168,128,0.2)' }}>
              <Shield size={32} style={{ color: 'var(--gold-soft)' }} />
            </div>
            <div>
              <span className="badge-active">CRACHÁ DE IDENTIFICAÇÃO</span>
              <h2 style={{ fontSize: '22px', margin: '2px 0 0 0', fontFamily: 'var(--font-serif)', color: '#F8F9FA' }}>{displayName}</h2>
              <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Award size={15} style={{ color: 'var(--gold-soft)' }} />
                Patente: <strong style={{ color: 'var(--gold-soft)' }}>{rank}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--gold-soft)', marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} /> Estatísticas Forenses
            </h3>
            <div className="stats-container">
              <div className="stat-box">
                <div className="stat-value">{solvedCount}</div>
                <div className="stat-label">Casos Resolvidos</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">94%</div>
                <div className="stat-label">Precisão Teórica</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{solvedCount * 2 + 1.5}h</div>
                <div className="stat-label">Horas em Campo</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">01</div>
                <div className="stat-label">Temporada</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Status da Missão / Retomar */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(145deg, rgba(20, 27, 31, 0.8) 0%, rgba(10, 13, 16, 0.9) 100%)' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--gold-soft)', marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={16} /> Central de Operações
            </h3>
            
            {activeRoomId && activeRoomCode ? (
              <div>
                <p style={{ color: '#A0AEC0', fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Existe uma sessão de investigação ativa associada a este dispositivo.
                </p>
                <div className="active-case-card">
                  <div className="active-case-info">
                    <span className="badge-active">SALA ATIVA</span>
                    <h4>CÓDIGO: {activeRoomCode}</h4>
                    <p style={{ margin: 0 }}>Sua equipe aguarda seu retorno.</p>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate(`/room/${activeRoomId}/game`)}
                    style={{ minHeight: '44px', padding: '0 20px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(184,153,83,0.3)' }}
                  >
                    <Play size={16} fill="currentColor" /> Retomar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#A0AEC0', fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Sem investigações em andamento no momento. Escolha um caso no arquivo para iniciar.
                </p>
                <button 
                  className="btn-secondary" 
                  onClick={() => navigate('/cases')}
                  style={{ width: '100%', marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '13px', padding: '14px 0', borderRadius: '10px' }}
                >
                  <Sparkles size={16} style={{ color: 'var(--gold-soft)' }} /> Selecionar Novo Caso
                </button>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Último Vestígio · v0.9.6</span>
            <span style={{ color: '#48BB78', fontWeight: 600 }}>🟢 ONLINE</span>
          </div>
        </div>

      </div>

      {/* 3. DESTAQUES EM INFORMAÇÕES (PILARES DO JOGO) */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="eyebrow">TECNOLOGIA & RECURSOS FORENSES</span>
          <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', color: '#F8F9FA', margin: '4px 0' }}>
            Como Funciona o Último Vestígio
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
            Ferramentas avançadas projetadas para simular o trabalho de uma equipe de investigação real.
          </p>
        </div>

        <div className="feature-grid">
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Bot size={24} />
            </div>
            <h3 style={{ fontSize: '16px', color: '#F8F9FA', margin: '0 0 8px 0', fontFamily: 'var(--font-serif)' }}>
              IA Forense Interativa
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
              Interrogue suspeitos virtuais com inteligência artificial que responde em linguagem natural e reage a contradições.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Compass size={24} />
            </div>
            <h3 style={{ fontSize: '16px', color: '#F8F9FA', margin: '0 0 8px 0', fontFamily: 'var(--font-serif)' }}>
              Modo Imersivo 360°
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
              Explore a planta baixa dos locais do crime, inspecione cômodos e analise fotos em alta definição de evidências.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '16px', color: '#F8F9FA', margin: '0 0 8px 0', fontFamily: 'var(--font-serif)' }}>
              Multiplayer Cooperativo
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
              Crie salas privadas para até 6 investigadores. Sincronize descobertas, debata teorias e vote em conjunto.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <LayoutGrid size={24} />
            </div>
            <h3 style={{ fontSize: '16px', color: '#F8F9FA', margin: '0 0 8px 0', fontFamily: 'var(--font-serif)' }}>
              Quadro de Investigação
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
              Conecte pistas com fios virtuais, organize suspeitos em um quadro de cortiça interativo e elabore a acusação final.
            </p>
          </div>

        </div>
      </section>

      {/* 4. DOSSIÊ DE CASOS EM DESTAQUE (CINEMATOGRÁFICO) */}
      <section style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="eyebrow">ARQUIVO MUNICIPAL</span>
            <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', color: '#F8F9FA', margin: '4px 0' }}>
              Investigações em Destaque
            </h2>
          </div>
          <button 
            onClick={() => navigate('/cases')} 
            style={{ color: 'var(--gold-soft)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Ver Todo o Arquivo <ArrowUpRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {featuredCases.map((item) => (
            <div 
              key={item.slug} 
              className="case-card-cinematic" 
              style={{ backgroundImage: `url("${item.image}")` }}
            >
              <div className="case-card-overlay">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge-difficulty ${item.level === 'Fácil' || item.level === 'easy' ? 'badge-easy' : item.level === 'Médio' || item.level === 'medium' ? 'badge-medium' : 'badge-hard'}`}>
                      {item.level}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--gold-soft)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                      {item.subtitle}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {item.duration}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={13} /> {item.players}</span>
                  </div>
                </div>

                <div style={{ margin: '20px 0' }}>
                  <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', color: '#F8F9FA', margin: '0 0 8px 0' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#CBD5E0', fontSize: '14px', margin: 0, maxWidth: '650px', fontWeight: 300, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/cases')}
                    style={{ minHeight: '42px', padding: '0 20px', fontSize: '12px', borderRadius: '8px' }}
                  >
                    Jogar (Modo clássico)
                  </button>
                  {item.slug === 'blackwell' && (
                    <button 
                      onClick={() => navigate('/cases')}
                      style={{ 
                        backgroundColor: 'rgba(212,175,55,0.15)', 
                        color: 'var(--gold-soft)', 
                        border: '1px solid var(--gold-soft)', 
                        padding: '0 20px', 
                        minHeight: '42px', 
                        borderRadius: '8px', 
                        fontWeight: 600, 
                        fontSize: '12px', 
                        cursor: 'pointer', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <Flame size={14} /> Jogar (Modo imersivo)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CITAÇÃO NOIR E METODOLOGIA */}
      <section style={{ border: '1px solid rgba(197, 168, 128, 0.15)', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(197, 168, 128, 0.04) 0%, transparent 80%)' }}>
        <span className="eyebrow" style={{ color: 'var(--gold-soft)' }}>CÓDIGO DE CONDUTA FORENSE</span>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '18px', color: '#F8F9FA', margin: '8px 0 0 0', lineHeight: 1.5 }}>
          “As pistas nunca mentem. São as interpretações apressadas que criam culpados.”
        </p>
      </section>

    </div>
  );
};

export default Home;
