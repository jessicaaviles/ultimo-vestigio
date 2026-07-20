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
    
    if (!code) {
      setError('Informe o código de acesso.');
      setLoading(false);
      return;
    }
    if (!name) {
      setError('Informe seu nome para entrar.');
      setLoading(false);
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Identidade não encontrada. Faça login novamente.');
        setLoading(false);
        return;
      }

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
    <div className="immersive-page is-fixed-height" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#0F1417',
      backgroundImage: `url(/backgrounds/equipe-investigadores.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Overlay gradiente */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(15, 20, 23, 0.2) 0%, rgba(15, 20, 23, 0.92) 55%, #0F1417 100%)',
        zIndex: 0
      }}></div>

      <div style={{ position: 'fixed', inset: 0, zIndex: 1, padding: '88px 24px calc(76px + env(safe-area-inset-bottom) + 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '30px', marginBottom: '6px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400, color: '#F8F9FA' }}>Junte-se à Equipe</h2>
          <p style={{ color: '#8E989F', fontSize: '13px', maxWidth: '85%', fontWeight: 300 }}>A investigação já começou. Insira suas credenciais para entrar.</p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div role="alert" style={{ color: '#d79b8e', border: '1px solid rgba(215,155,142,.4)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', fontWeight: 600 }}>
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
                padding: '14px',
                borderRadius: '8px',
                fontSize: '22px', 
                letterSpacing: '8px', 
                textAlign: 'center', 
                fontFamily: 'var(--font-sans)',
                fontWeight: 700, 
                backgroundColor: 'rgba(15, 20, 23, 0.7)', 
                color: 'var(--gold-soft)',
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(184,153,83,.3)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', fontWeight: 600 }}>
              Identificação (Nome)
            </label>
            <input 
              placeholder="Como devemos chamá-lo?" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '14px',
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
