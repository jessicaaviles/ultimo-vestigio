import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCases } from '../services/api';
import { Clock3, Flame, UsersRound } from 'lucide-react';
import Loading from '../components/Loading';

interface CaseItem {
  slug: string;
  title: string;
  synopsis: string;
  type: string;
  duration: string;
  difficulty: 'Muito fácil' | 'Fácil' | 'Média' | 'Difícil' | 'Sobrenatural';
  players: string;
  tension: number;
  image: string;
  cover_image_data: string | null;
}

const Cases: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [solvedCases, setSolvedCases] = useState<string[]>([]);

  React.useEffect(() => {
    setSolvedCases(JSON.parse(localStorage.getItem('solvedCases') || '[]'));
    listCases().then((response) => {
      if (response.success && response.data?.length) {
        const mapped = response.data.map((item: any) => {
          const image = item.cover_image_data
            ? item.cover_image_data
            : item.slug === 'o-quarto-7'
              ? '/capa_quarto_7.png'
              : '/backgrounds/mapa-da-investigacao.png';
          return {
            slug: item.slug, title: item.title, synopsis: item.short_synopsis,
            type: item.case_type, duration: `${item.estimated_duration_minutes} min`,
            difficulty: item.difficulty, players: `${item.min_players}-${item.max_players} Jogadores`,
            tension: item.tension_level, image, cover_image_data: item.cover_image_data
          };
        });
        setCases(mapped);
      } else if (!response.success) setError('Não foi possível carregar os casos.');
    }).catch(() => setError('Não foi possível carregar os casos.')).finally(() => setLoading(false));
  }, []);

  const handleSelectCase = (slug: string) => {
    const c = cases.find(item => item.slug === slug);
    navigate(`/create?caseId=${slug}`, { state: { coverImage: c?.cover_image_data || null } });
  };

  return (
    <div className="cases-page" style={{
      minHeight: '100vh',
      backgroundColor: '#0F1417',
      color: '#F8F9FA',
      padding: '24px 24px 96px 24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header da Página */}
      <div style={{ marginBottom: '32px' }}>
        <span style={{ color: '#C5A880', fontSize: '10px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>
          ARQUIVO MUNICIPAL
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, margin: '4px 0 8px 0' }}>
          Casos Disponíveis
        </h1>
        <p style={{ color: '#8E989F', fontSize: '14px', lineHeight: '1.45', margin: 0, fontWeight: 300 }}>
          Selecione uma investigação ativa para iniciar ou configurar uma sala multiplayer.
        </p>
      </div>

      {/* Lista de Casos */}
      {error && <div role="alert" style={{ color: '#d79b8e', marginBottom: '16px' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? <Loading message="Abrindo o arquivo de casos..." fullPage={false} /> : cases.map((item) => (
          <div 
            key={item.slug}
            onClick={() => setSelectedCase(item)}
            style={{
              backgroundColor: '#13191C',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease',
            }}
          >
            {/* Imagem do Case */}
            <div style={{
              height: '160px',
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(15, 20, 23, 0.85)',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '9px',
                color: '#C5A880',
                fontWeight: 600,
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                {item.type}
              </div>
              
              {solvedCases.includes(item.slug) && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'var(--olive)',
                  color: 'var(--paper)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  ✅ Resolvido
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: 0, fontWeight: 400 }}>
                  {item.title}
                </h3>
                <span style={{
                  fontSize: '9px',
                  color: '#C5A880',
                  backgroundColor: 'rgba(197, 168, 128, 0.08)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {item.difficulty}
                </span>
              </div>
              <p style={{ color: '#8E989F', fontSize: '12px', margin: 0, lineHeight: 1.4, fontWeight: 300 }}>
                {item.synopsis}
              </p>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#8E989F', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '10px' }}>
                 <span className="case-meta"><UsersRound size={12} /> {item.players}</span>
                 <span className="case-meta"><Clock3 size={12} /> {item.duration}</span>
                 <span className="case-meta"><Flame size={12} /> Tensão: {item.tension}/5</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes do Caso */}
      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 20, 23, 0.95)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}>
          {/* Fundo do Modal */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0
          }} onClick={() => setSelectedCase(null)}></div>

          {/* Conteúdo do Modal (estilo Bottom Sheet) */}
          <div style={{
            width: '100%',
            maxHeight: '90vh',
            backgroundColor: '#13191C',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            zIndex: 101,
            overflowY: 'auto',
            padding: '28px 24px 40px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Barra de Fechamento */}
            <div style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              alignSelf: 'center',
              cursor: 'pointer'
            }} onClick={() => setSelectedCase(null)}></div>

            {/* Título e Sinopse */}
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#C5A880', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {selectedCase.type}
                </span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }}></span>
                <span style={{ color: '#8E989F', fontSize: '10px', textTransform: 'uppercase' }}>
                  {selectedCase.difficulty}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, margin: '0 0 12px 0' }}>
                {selectedCase.title}
              </h2>
              <p style={{ color: '#8E989F', fontSize: '14px', lineHeight: 1.5, margin: 0, fontWeight: 300 }}>
                {selectedCase.synopsis}
              </p>
            </div>

            {/* Metadados Detalhados */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#0F1417',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <span style={{ fontSize: '9px', color: '#8E989F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duração</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{selectedCase.duration}</div>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#8E989F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tensão</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{selectedCase.tension}/5</div>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#8E989F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jogadores</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{selectedCase.players}</div>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#8E989F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nível Editorial</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px', color: '#C5A880' }}>Premium</div>
              </div>
            </div>

            {/* Botão de Escolha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <button className="btn-primary"
                onClick={() => handleSelectCase(selectedCase.slug)}
                style={{
                   backgroundColor: 'var(--olive)',
                   color: 'var(--paper)',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Escolher este caso
              </button>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#8E989F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
