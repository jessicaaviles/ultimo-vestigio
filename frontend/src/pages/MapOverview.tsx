import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MapOverview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="layout" style={{ 
      backgroundImage: 'url(/backgrounds/map_blackwell.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Overlay gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.9) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <button onClick={() => navigate('/cases')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={20} /> Voltar
            </button>
            <span style={{ color: 'var(--accent-gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Caso Ativo</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', margin: '4px 0', lineHeight: 1.1 }}>O Segredo de<br/>Blackwell House</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', maxWidth: '280px', marginTop: '8px' }}>Explore os locais, encontre pistas e descubra o que realmente aconteceu.</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '4px' }}>Progresso da investigação</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', width: '100px' }}>
                <div style={{ height: '100%', width: '68%', background: 'var(--accent-gold)', borderRadius: '2px' }} />
              </div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>68%</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 'auto' }}>
          <button style={{ background: 'none', border: 'none', borderBottom: '2px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '12px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Mapa</button>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '12px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Pistas</button>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '12px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Pessoas</button>
        </div>

        {/* Map Pins */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Sala de Estar */}
          <div style={{ position: 'absolute', top: '40%', left: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/scene/sala-de-estar')}>
            <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid var(--accent-gold)', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'Playfair Display, serif' }}>Sala de Estar</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>4/5 pistas</div>
            </div>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-gold)', boxShadow: '0 0 20px var(--accent-gold)', border: '2px solid rgba(255,255,255,0.8)' }} />
          </div>

          {/* Quarto 7 */}
          <div style={{ position: 'absolute', top: '25%', left: '45%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'Playfair Display, serif' }}>Quarto 7</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Trancado</div>
            </div>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.5)' }} />
          </div>
        </div>

        {/* Bottom Panel */}
        <div style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '24px' }}>
          <img src="/backgrounds/scene_living_room.png" alt="Preview" style={{ width: '100px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--accent-gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Local em Destaque</div>
            <div style={{ color: '#fff', fontSize: '18px', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>Sala de Estar</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: 1.4 }}>Principal ponto de encontro da família. Foi aqui que Clara foi vista pela última vez.</div>
          </div>
          <button onClick={() => navigate('/scene/sala-de-estar')} style={{ alignSelf: 'center', background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            Explorar
          </button>
        </div>

      </div>
    </div>
  );
};

export default MapOverview;
