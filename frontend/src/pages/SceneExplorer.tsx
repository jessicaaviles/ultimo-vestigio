import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ThumbsUp, ThumbsDown, Brain, X } from 'lucide-react';
import { useInvestigation } from '../contexts/InvestigationContext';

const SceneExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [uvLight, setUvLight] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const { discoveredClues, addClue } = useInvestigation();

  const { sceneId } = useParams<{ sceneId: string }>();
  const id = sceneId || 'living_room';
  
  const sceneConfig: Record<string, any> = {
    living_room: {
      title: 'Sala de Estar', subtitle: 'Cena do Crime', bg: '/backgrounds/scene_living_room.png',
      hotspots: [
        { id: 'fireplace', label: 'Restos na Lareira', subLabel: 'Passagem aérea', top: '40%', left: '80%' },
        { id: 'blood', label: 'Sangue Artificial', subLabel: 'Sem respingos', top: '90%', left: '75%', requiresUv: true },
        { id: 'wine_glass', label: 'Taça Quebrada', subLabel: 'Briga ou acidente?', top: '75%', left: '25%' },
      ]
    },
    library: {
      title: 'Biblioteca', subtitle: 'Escritório de Tomás', bg: '/backgrounds/scene_library.png',
      hotspots: [
        { id: 'desk_letter', label: 'Carta de Helena', subLabel: 'Aviso urgente', top: '65%', left: '55%' },
        { id: 'safe', label: 'Cofre Oculto', subLabel: 'Trancado e vazio?', top: '50%', left: '22%' },
        { id: 'cigar', label: 'Charuto Apagado', subLabel: 'Visita recente', top: '70%', left: '45%' },
      ]
    },
    bedroom: {
      title: 'Quarto Principal', subtitle: 'Aposentos de Clara', bg: '/backgrounds/scene_bedroom.png',
      hotspots: [
        { id: 'mirror_msg', label: 'Mensagem no Espelho', subLabel: 'Escrita em segredo', top: '35%', left: '70%', requiresUv: true },
        { id: 'suitcase', label: 'Mala', subLabel: 'Roupas de frio intenso', top: '80%', left: '60%' },
        { id: 'pills', label: 'Remédios', subLabel: 'Para ansiedade', top: '55%', left: '25%' },
      ]
    },
    garden: {
      title: 'Jardins', subtitle: 'Área Externa', bg: '/backgrounds/scene_garden.png',
      hotspots: [
        { id: 'fountain', label: 'Fonte de Pedra', subLabel: 'Livro-caixa queimado', top: '70%', left: '30%' },
        { id: 'mud', label: 'Pegadas na Lama', subLabel: 'Duas pessoas', top: '85%', left: '65%' },
        { id: 'animal_bones', label: 'Ossos Pequenos', subLabel: 'Cachorro ou humano?', top: '75%', left: '15%' },
      ]
    }
  };

  const scene = sceneConfig[id] || sceneConfig['living_room'];
  const hotspots = scene.hotspots;
  const totalClues = hotspots.length;

  const handleHotspotClick = (clueId: string) => {
    addClue(clueId);
    navigate(`/evidence/${clueId}`);
  };

  const clueImages: Record<string, string> = {
    fireplace: '/backgrounds/ev_photo.png', blood: '/backgrounds/ev_blood.png', wine_glass: '/backgrounds/ev_photo.png',
    desk_letter: '/backgrounds/ev_letter.png', safe: '/backgrounds/ev_photo.png', cigar: '/backgrounds/ev_photo.png',
    mirror_msg: '/backgrounds/ev_letter.png', suitcase: '/backgrounds/ev_photo.png', pills: '/backgrounds/ev_photo.png',
    fountain: '/backgrounds/ev_diary.png', mud: '/backgrounds/ev_photo.png', animal_bones: '/backgrounds/ev_photo.png'
  };

  const foundClues = discoveredClues
    .filter(cid => hotspots.some((h: any) => h.id === cid))
    .map(cid => ({ id: cid, url: clueImages[cid] || '/backgrounds/ev_letter.png' }));

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Background da Cena */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url(${scene.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        filter: uvLight ? 'brightness(0.7) contrast(1.4) sepia(1) hue-rotate(240deg) saturate(2.5)' : 'none',
        transition: 'filter 0.5s ease'
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(10,13,16,0.9) 0%, rgba(10,13,16,0.3) 40%, rgba(10,13,16,0.8) 80%, #0A0D10 100%)', zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Informações Superiores e Minimapa */}
        <div style={{ display: 'flex', padding: '0 24px', marginTop: '100px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>{scene.subtitle}</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '0 0 8px 0', color: '#F8F9FA', fontWeight: 400 }}>{scene.title}</h1>
            <p style={{ color: '#8E989F', fontSize: '13px', margin: '0 0 24px 0', maxWidth: '200px', lineHeight: 1.4 }}>
              Explore a cena. Cada detalhe pode ser uma pista.
            </p>
            
            <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>Pistas Encontradas</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ color: '#F8F9FA', fontSize: '24px', fontWeight: 400 }}>{foundClues.length}</span>
              <span style={{ color: '#8E989F', fontSize: '14px' }}>/ {totalClues}</span>
            </div>
          </div>

          {/* Mini-map mock */}
          <button 
            onClick={() => setShowMapModal(true)}
            style={{ 
              width: '120px', height: '120px', background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px', 
              display: 'flex', flexDirection: 'column', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#8E989F', fontSize: '10px', width: '100%' }}>
              Térreo <ChevronDown size={12} />
            </div>
            <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative', width: '100%' }}>
              {/* Box da sala */}
              <div style={{ position: 'absolute', top: '30%', left: '20%', width: '30%', height: '30%', border: '1px solid #C5A880', background: 'rgba(197,168,128,0.2)' }}>
                <div style={{ width: '4px', height: '4px', background: '#C5A880', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
            </div>
          </button>
        </div>

        {/* Hotspots */}
        <div style={{ flex: 1, position: 'relative' }}>
          {hotspots.map((hotspot: any) => {
            if (hotspot.requiresUv && !uvLight) return null;
            return (
              <div 
                key={hotspot.id} 
                style={{ position: 'absolute', top: hotspot.top, left: hotspot.left, display: 'flex', alignItems: 'center', gap: '8px', transform: 'translate(-50%, -50%)', cursor: 'pointer' }}
                onClick={() => handleHotspotClick(hotspot.id)}
              >
                <div style={{ 
                  width: '24px', height: '24px', minWidth: '24px', flexShrink: 0, borderRadius: '50%', 
                  border: `1px solid ${hotspot.requiresUv && uvLight ? 'rgba(168, 85, 247, 0.8)' : 'rgba(197, 168, 128, 0.5)'}`, 
                  background: hotspot.requiresUv && uvLight ? 'rgba(168, 85, 247, 0.2)' : 'rgba(10,13,16,0.6)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
                  boxShadow: hotspot.requiresUv && uvLight ? '0 0 15px rgba(168, 85, 247, 0.5)' : 'none'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hotspot.requiresUv && uvLight ? '#D8B4FE' : '#C5A880' }} />
                </div>
                <div style={{ background: 'rgba(10,13,16,0.7)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)' }}>
                  <div style={{ color: hotspot.requiresUv && uvLight ? '#D8B4FE' : '#F8F9FA', fontSize: '11px', fontWeight: 600 }}>{hotspot.label}</div>
                  <div style={{ color: '#8E989F', fontSize: '9px' }}>{hotspot.subLabel}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '0 24px', marginTop: 'auto', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginBottom: '24px' }}>
            {/* UV Button */}
            <button 
              onClick={() => setUvLight(!uvLight)}
              style={{ 
                background: uvLight ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', 
                border: `1px solid ${uvLight ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255,255,255,0.1)'}`, 
                color: uvLight ? '#D8B4FE' : '#F8F9FA', 
                padding: '12px 16px', borderRadius: '24px', fontSize: '11px', fontWeight: 600, 
                display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
                boxShadow: uvLight ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none'
              }}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: uvLight ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
              </div>
              Visão com Luz UV
            </button>
          </div>

          {/* AI Tip Box */}
          <div style={{ background: '#13191C', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', display: 'flex', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}>
              <Brain size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Dica da IA</div>
              <p style={{ color: '#F8F9FA', fontSize: '13px', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                Análise comportamental: As pistas (Carta e Chave) estão posicionadas de forma quase teatral, sugerindo uma cena montada.
              </p>
              <div style={{ color: '#8E989F', fontSize: '11px' }}>Confiança: 82%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#8E989F', cursor: 'pointer' }}><ThumbsUp size={14} /></button>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#8E989F', cursor: 'pointer' }}><ThumbsDown size={14} /></button>
            </div>
          </div>

        </div>
      </div>
      {/* Map Modal */}
      {showMapModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(10, 13, 16, 0.95)', zIndex: 100, display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(10px)'
        }}>
          <header style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#C5A880', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Planta Baixa</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '4px 0 0 0', color: '#F8F9FA', fontWeight: 400 }}>Térreo</h2>
            </div>
            <button onClick={() => setShowMapModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8F9FA', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </header>
          <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1.2', border: '1px solid rgba(197, 168, 128, 0.3)', borderRadius: '16px', background: 'rgba(197, 168, 128, 0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%', border: '2px solid rgba(255,255,255,0.1)' }}>
                {/* Rooms Outline Mock */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '40%', borderRight: '2px solid rgba(255,255,255,0.1)', borderBottom: '2px solid rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '30%', borderBottom: '2px solid rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%', background: 'rgba(197, 168, 128, 0.1)', border: '1px solid #C5A880' }}>
                  <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, padding: '8px' }}>Sala de Estar (Você está aqui)</div>
                  <div style={{ width: '8px', height: '8px', background: '#C5A880', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', boxShadow: '0 0 10px #C5A880' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneExplorer;
