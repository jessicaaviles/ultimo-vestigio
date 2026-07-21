import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flashlight, Eye, MessageSquare, Briefcase, Plus, Trophy } from 'lucide-react';

const SceneExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [uvLight, setUvLight] = useState(false);
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(true);

  const hotspots = [
    { id: 'window', label: 'Janela Entreaberta', top: '30%', left: '30%', isFound: discoveredClues.includes('window') },
    { id: 'armchair', label: 'Poltrona Revirada', top: '55%', left: '35%', isFound: discoveredClues.includes('armchair') },
    { id: 'table', label: 'Anotações Rasgadas', top: '70%', left: '55%', isFound: discoveredClues.includes('table') },
    { id: 'fireplace', label: 'Lareira Apagada', top: '50%', left: '80%', isFound: discoveredClues.includes('fireplace') },
    { id: 'blood', label: 'Mancha de Sangue', top: '80%', left: '75%', isFound: discoveredClues.includes('blood'), requiresUv: true },
  ];

  const handleHotspotClick = (id: string, requiresUv?: boolean) => {
    if (requiresUv && !uvLight) return;
    if (!discoveredClues.includes(id)) {
      setDiscoveredClues([...discoveredClues, id]);
    }
  };

  return (
    <div className="layout" style={{ 
      backgroundImage: uvLight ? 'url(/backgrounds/scene_living_room.png)' : 'url(/backgrounds/scene_living_room.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      position: 'relative',
      filter: uvLight ? 'contrast(1.2) hue-rotate(240deg) saturate(1.5) brightness(0.6)' : 'none',
      transition: 'all 0.5s ease'
    }}>
      {/* Overlay gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.9) 100%)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Header */}
        <header style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={() => navigate('/map/blackwell')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>
              <ArrowLeft size={20} /> Voltar
            </button>
            <span style={{ color: 'var(--accent-gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Cena do Crime</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', margin: '4px 0' }}>Sala de Estar</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Explore a cena. Cada detalhe pode ser uma pista.</p>
            
            <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
               <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Pistas Encontradas</span>
               <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{discoveredClues.length} / {hotspots.length}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setUvLight(!uvLight)}
                style={{ 
                  background: uvLight ? 'rgba(138,43,226,0.8)' : 'rgba(0,0,0,0.6)', 
                  border: `1px solid ${uvLight ? 'rgba(138,43,226,1)' : 'rgba(255,255,255,0.2)'}`, 
                  color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer',
                  boxShadow: uvLight ? '0 0 20px rgba(138,43,226,0.5)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <Flashlight size={20} />
              </button>
            </div>
            
            {/* Mini Map */}
            <div style={{ width: '120px', height: '120px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', position: 'relative' }}>
               <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Térreo</div>
               {/* Simplified floor plan drawing */}
               <div style={{ width: '100%', height: '70%', border: '1px solid rgba(255,255,255,0.2)', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: '40%', left: '30%', width: '30%', height: '30%', background: 'rgba(212,175,55,0.3)', border: '1px solid var(--accent-gold)' }}>
                   <div style={{ width: '4px', height: '4px', background: 'var(--accent-gold)', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                 </div>
               </div>
            </div>
          </div>
        </header>

        {/* Hotspots Container */}
        <div style={{ flex: 1, position: 'relative' }}>
          {hotspots.map(spot => {
            const isVisible = spot.requiresUv ? uvLight : true;
            if (!isVisible) return null;
            
            return (
              <div 
                key={spot.id}
                onClick={() => handleHotspotClick(spot.id, spot.requiresUv)}
                style={{
                  position: 'absolute',
                  top: spot.top,
                  left: spot.left,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  opacity: spot.isFound ? 0.6 : 1,
                  transform: spot.isFound ? 'scale(0.9)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: spot.isFound ? 'rgba(0,0,0,0.6)' : (spot.requiresUv ? 'rgba(138,43,226,0.8)' : 'rgba(212,175,55,0.8)'),
                  border: `2px solid ${spot.isFound ? 'rgba(255,255,255,0.3)' : (spot.requiresUv ? '#fff' : '#fff')}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: spot.isFound ? 'none' : `0 0 15px ${spot.requiresUv ? 'rgba(138,43,226,0.8)' : 'rgba(212,175,55,0.5)'}`
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>{spot.label}</div>
                  <div style={{ color: spot.isFound ? 'rgba(255,255,255,0.5)' : (spot.requiresUv ? '#b088ff' : 'var(--accent-gold)'), fontSize: '10px' }}>
                    {spot.isFound ? 'Verificada' : 'Investigar'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Panel */}
        <div style={{ padding: '24px', pointerEvents: 'auto' }}>
          
          {/* AI Tip */}
          {showHint && (
            <div style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', maxWidth: '400px' }}>
              <div style={{ background: 'rgba(212,175,55,0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-gold)' }}>
                <Eye size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--accent-gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Dica da IA</div>
                <div style={{ color: '#fff', fontSize: '13px', lineHeight: 1.4 }}>A posição do copo e a mancha de sangue sugerem que houve uma discussão antes do crime.</div>
              </div>
              <button onClick={() => setShowHint(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><ArrowLeft size={16} style={{ transform: 'rotate(-90deg)' }} /></button>
            </div>
          )}

          {/* Bottom Nav Bar (Standardized) */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(20,20,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px', margin: '0 -24px -24px -24px' }}>
            <button className="nav-item">
              <Eye size={20} />
              <span>Início</span>
            </button>
            <button className="nav-item active">
              <Briefcase size={20} />
              <span>Casos</span>
            </button>
            <button className="nav-fab">
              <Plus size={24} />
            </button>
            <button className="nav-item">
              <MessageSquare size={20} />
              <span>Mensagens</span>
            </button>
            <button className="nav-item">
              <Trophy size={20} />
              <span>Ranking</span>
            </button>
          </div>

        </div>
      </div>
      
      <style>{`
        .nav-item { background: none; border: none; color: rgba(255,255,255,0.4); display: flex; flexDirection: column; alignItems: center; gap: 4px; font-size: 10px; cursor: pointer; }
        .nav-item.active { color: var(--accent-gold); }
        .nav-fab { background: #4a2b2b; border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transform: translateY(-20px); }
      `}</style>
    </div>
  );
};

export default SceneExplorer;
