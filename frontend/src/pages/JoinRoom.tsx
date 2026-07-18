import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { joinRoom } from '../services/api';

const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room')?.toUpperCase() || '');
  const [name, setName] = useState(() => localStorage.getItem('userName') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const userId = localStorage.getItem('userId');
    if (!userId || !name || !code) {
      setError('Preencha o código e seu nome para entrar.');
      setLoading(false);
      return;
    }

    try {
      const res = await joinRoom(code.toUpperCase(), userId, name);
      if (res.success) {
        localStorage.setItem('userName', name.trim());
        navigate(`/room/${res.data.roomId}/lobby`);
      } else {
        setError(res.error || "Falha ao entrar");
      }
    } catch (e) {
      console.error(e);
      setError("Não foi possível conectar à sala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="immersive-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#0F1417',
      backgroundImage: `url(/backgrounds/equipe-investigadores.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Overlay gradiente */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(15, 20, 23, 0.3) 0%, rgba(15, 20, 23, 0.95) 60%, #0F1417 100%)',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', marginTop: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#8E989F', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400, color: '#F8F9FA' }}>Junte-se à Equipe</h2>
        <p style={{ color: '#8E989F', fontSize: '14px', marginBottom: '32px', maxWidth: '85%', fontWeight: 300 }}>A investigação já começou. Insira suas credenciais para entrar.</p>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && <div role="alert" style={{ color: '#d79b8e', border: '1px solid rgba(215,155,142,.4)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', marginBottom: '12px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', fontWeight: 600 }}>
              Código de Acesso
            </label>
            <input 
              placeholder="Ex: AB123C" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
              style={{ 
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '24px', 
                letterSpacing: '6px', 
                textAlign: 'center', 
                fontFamily: 'var(--font-serif)', 
                fontWeight: 600, 
                backgroundColor: 'rgba(15, 20, 23, 0.7)', 
                color: '#F8F9FA',
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.08)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', fontWeight: 600 }}>
              Identificação (Nome)
            </label>
            <input 
              placeholder="Como devemos chamá-lo?" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'rgba(15, 20, 23, 0.7)', 
                color: '#F8F9FA',
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.08)',
                outline: 'none'
              }}
            />
          </div>

          <button className="btn-primary"
            type="submit" 
            disabled={loading || !code || !name}
            style={{ 
              padding: '16px 24px', 
              fontSize: '14px', 
              marginTop: '8px',
              backgroundColor: 'var(--olive)',
              color: 'var(--paper)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Acessando...' : 'Confirmar e Entrar'}
            <span style={{ color: 'var(--gold-soft)', marginLeft: '8px' }}>→</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;
