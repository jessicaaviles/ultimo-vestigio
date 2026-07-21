import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Lock } from 'lucide-react';


const MapOverview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPin, setSelectedPin] = useState<string | null>('living_room');

  const locations = [
    { id: 'living_room', title: 'Sala de Estar', status: 'investigating', top: '55%', left: '45%', pistas: 5 },
    { id: 'library', title: 'Biblioteca', status: 'locked', top: '40%', left: '70%', pistas: 0 },
    { id: 'bedroom', title: 'Quarto Principal', status: 'locked', top: '30%', left: '30%', pistas: 0 },
    { id: 'garden', title: 'Jardins', status: 'locked', top: '75%', left: '20%', pistas: 0 }
  ];

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Background Completo (Planta Baixa) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/backgrounds/map_blackwell.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        opacity: 0.8
      }} />

      {/* Fade Superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh',
        background: 'linear-gradient(180deg, #0A0D10 0%, rgba(10,13,16,0.3) 50%, rgba(10,13,16,0) 100%)', zIndex: 1
      }} />

      {/* Header Topo */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Título do Mapa */}
        <div style={{ padding: '0 24px', marginTop: '100px' }}>
          <span style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Planta Baixa</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '8px 0', color: '#F8F9FA', fontWeight: 400, lineHeight: 1.1 }}>Blackwell House</h1>
          <p style={{ color: '#8E989F', fontSize: '13px', margin: '8px 0 24px 0', maxWidth: '80%', lineHeight: 1.5 }}>
            Selecione um cômodo para investigar.
          </p>
        </div>

        {/* Barra de Progresso Global */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ 
            background: 'rgba(10, 13, 16, 0.6)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '16px',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#8E989F', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Exploração da Mansão</span>
              <span style={{ color: '#C5A880', fontSize: '11px', fontWeight: 600 }}>68%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: '#C5A880', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Área Interativa do Mapa */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setSelectedPin(loc.id)}
            style={{
              position: 'absolute', top: loc.top, left: loc.left,
              background: 'transparent', border: 'none', padding: 0, margin: 0,
              transform: 'translate(-50%, -50%)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: selectedPin === loc.id ? 10 : 1
            }}
          >
            {/* O "Pin" propriamente dito */}
            <div style={{
              width: selectedPin === loc.id ? '20px' : '12px',
              height: selectedPin === loc.id ? '20px' : '12px',
              borderRadius: '50%',
              backgroundColor: loc.status === 'locked' ? '#333' : '#C5A880',
              border: `2px solid ${selectedPin === loc.id ? '#FFF' : 'rgba(255,255,255,0.3)'}`,
              boxShadow: selectedPin === loc.id ? '0 0 15px rgba(197,168,128,0.8)' : '0 4px 8px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {loc.status === 'locked' && <Lock size={8} color="#999" />}
            </div>
            
            {/* Label que aparece ao selecionar */}
            {selectedPin === loc.id && (
              <div style={{
                backgroundColor: 'rgba(20, 25, 28, 0.95)',
                border: '1px solid rgba(197,168,128,0.3)',
                padding: '12px 16px', borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                width: 'max-content',
                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                transform: 'translateY(4px)'
              }}>
                <div style={{ color: '#F8F9FA', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{loc.title}</div>
                
                {loc.status === 'locked' ? (
                  <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Local Trancado
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8E989F', fontSize: '10px', marginBottom: '12px' }}>
                      <Search size={12} /> {loc.pistas} pistas possíveis
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/scene/${loc.id}`);
                      }} 
                      style={{ 
                        background: '#C4A77F', border: 'none', color: '#0A0D10', padding: '8px 16px', borderRadius: '20px', 
                        fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', width: '100%', justifyContent: 'center',
                        textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(197, 168, 128, 0.2)'
                      }}
                    >
                      Explorar local <ArrowRight size={12} />
                    </button>
                  </>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapOverview;
