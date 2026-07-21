import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flashlight, ChevronDown, ThumbsUp, ThumbsDown, Brain } from 'lucide-react';
import { useInvestigation } from '../contexts/InvestigationContext';

const SceneExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { discoveredClues, addClue } = useInvestigation();
  const [uvLight, setUvLight] = useState(false);

  // Hardcoded for 'sala-de-estar'
  const totalClues = 5; // To match map 
  const hotspots = [
    { id: 'window', label: 'Janela', subLabel: 'Entreaberta', top: '30%', left: '15%' },
    { id: 'armchair', label: 'Poltrona', subLabel: 'Revirada', top: '60%', left: '85%' },
    { id: 'table', label: 'Anotações', subLabel: 'Rasgadas', top: '48%', left: '38%' },
    { id: 'fireplace', label: 'Lareira', subLabel: 'Apagada', top: '40%', left: '80%' },
    { id: 'blood', label: 'Mancha de Sangue', subLabel: 'Recente', top: '65%', left: '75%', requiresUv: true },
  ];

  const handleHotspotClick = (id: string) => {
    addClue(id);
    navigate(`/evidence/${id}`);
  };

  // Mapeamento de imagens para cada pista
  const clueImages: Record<string, string> = {
    window: '/backgrounds/ev_photo.png',
    armchair: '/backgrounds/ev_letter.png',
    table: '/backgrounds/ev_letter.png',
    fireplace: '/backgrounds/ev_photo.png',
    blood: '/backgrounds/ev_key_7.png',
  };

  const foundClues = discoveredClues
    .filter(id => hotspots.some(h => h.id === id))
    .map(id => ({ id, url: clueImages[id] || '/backgrounds/ev_letter.png' }));

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Background da Cena */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/backgrounds/scene_living_room.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        filter: uvLight ? 'brightness(0.7) contrast(1.4) sepia(1) hue-rotate(240deg) saturate(2.5)' : 'none',
        transition: 'filter 0.5s ease'
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(10,13,16,0.9) 0%, rgba(10,13,16,0.3) 40%, rgba(10,13,16,0.8) 80%, #0A0D10 100%)', zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Header Topo */}
        <header style={{ padding: '48px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F8F9FA', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ color: '#C5A880', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Cena do Crime</div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F8F9FA', backdropFilter: 'blur(10px)' }}>
            <Flashlight size={18} />
          </div>
        </header>

        {/* Informações Superiores e Minimapa */}
        <div style={{ display: 'flex', padding: '0 24px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '0 0 8px 0', color: '#F8F9FA', fontWeight: 400 }}>Sala de Estar</h1>
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
          <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#8E989F', fontSize: '10px' }}>
              Térreo <ChevronDown size={12} />
            </div>
            <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
              {/* Box da sala */}
              <div style={{ position: 'absolute', top: '30%', left: '20%', width: '30%', height: '30%', border: '1px solid #C5A880', background: 'rgba(197,168,128,0.2)' }}>
                <div style={{ width: '4px', height: '4px', background: '#C5A880', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Hotspots */}
        <div style={{ flex: 1, position: 'relative' }}>
          {hotspots.map((hotspot) => {
            if (hotspot.requiresUv && !uvLight) return null;
            return (
              <div 
                key={hotspot.id} 
                style={{ position: 'absolute', top: hotspot.top, left: hotspot.left, display: 'flex', alignItems: 'center', gap: '8px', transform: 'translate(-50%, -50%)', cursor: 'pointer' }}
                onClick={() => handleHotspotClick(hotspot.id)}
              >
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
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
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: uvLight ? '#A855F7' : '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                A posição do copo e a mancha de sangue sugerem que houve uma discussão antes do crime.
              </p>
              <div style={{ color: '#8E989F', fontSize: '11px' }}>Confiança: 68%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#8E989F', cursor: 'pointer' }}><ThumbsUp size={14} /></button>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#8E989F', cursor: 'pointer' }}><ThumbsDown size={14} /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SceneExplorer;
