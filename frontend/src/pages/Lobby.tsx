import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/useSocket';
import { QRCodeCanvas } from 'qrcode.react';
import Loading from '../components/Loading';

const Lobby: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [roomData, setRoomData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!socket || !roomId) return;

    const userId = localStorage.getItem('userId');
    socket.emit('join_room', { roomId, userId });

    socket.on('room_state_updated', (data) => {
      setRoomData(data);
    });

    socket.on('game_started', () => {
      navigate(`/room/${roomId}/briefing`);
    });

    return () => {
      socket.off('room_state_updated');
      socket.off('game_started');
    };
  }, [socket, roomId, navigate]);

  if (!roomData) return <Loading message="Conectando à sala..." />;

  const players = roomData.players || [];
  const isHost = players.some((p: any) => p.anonymous_user_id === localStorage.getItem('userId') && p.is_host);

  const handleStart = () => {
    socket?.emit('start_game', { roomId, userId: localStorage.getItem('userId') });
  };

  const handleReady = () => {
    const next = !isReady; setIsReady(next); socket?.emit('player_ready', { roomId, userId: localStorage.getItem('userId'), ready: next });
  };

  const invite = `${window.location.origin}/join?room=${roomData.public_code}`;

  return (
    <div className="immersive-page is-fixed-height" style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0F1417',
      backgroundImage: `url(/backgrounds/lobby.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Overlay gradiente */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(15, 20, 23, 0.3) 0%, rgba(15, 20, 23, 0.88) 45%, #0F1417 100%)',
        zIndex: 0
      }}></div>

      {/* Conteúdo fixo no viewport */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        padding: '88px 24px calc(76px + env(safe-area-inset-bottom) + 24px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '14px'
      }}>

        {/* Cabeçalho */}
        <div>
          <span style={{ display: 'block', color: 'var(--gold-soft)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Sala de Briefing
          </span>
          <h2 style={{ fontSize: '28px', marginBottom: '4px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400, color: '#F8F9FA' }}>
            {roomData.case_version?.case_ref?.title || 'O Quarto 7'}
          </h2>
          <p style={{ color: '#8E989F', fontSize: '12px', fontWeight: 300 }}>Aguardando os investigadores da equipe.</p>
        </div>

        {/* Código + Convite (linha única) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Código */}
          <div style={{
            flex: 1, padding: '12px 14px', borderRadius: '8px',
            backgroundColor: 'rgba(15, 20, 23, 0.7)',
            border: '1px solid rgba(184,153,83,.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '9px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '4px' }}>Código da sala</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, letterSpacing: '6px', color: 'var(--gold-soft)' }}>
              {roomData.public_code}
            </div>
          </div>

          {/* QR Code */}
          <div style={{
            padding: '10px 14px', borderRadius: '8px',
            backgroundColor: 'rgba(15, 20, 23, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
          }}>
            <div style={{ padding: '6px', background: '#fff', borderRadius: '4px' }}>
              <QRCodeCanvas value={invite} size={60} bgColor="#ffffff" fgColor="#182126" />
            </div>
            <button onClick={() => navigator.clipboard?.writeText(invite)} style={{
              background: 'transparent', border: 'none', color: '#C5A880',
              fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px',
              fontWeight: 600, cursor: 'pointer', padding: 0
            }}>Copiar link</button>
          </div>
        </div>

        {/* Equipe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: '9px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
            Equipe ({players.length}/{roomData.max_players})
          </div>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0 }}>
            {players.map((p: any) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px',
                backgroundColor: 'rgba(15, 20, 23, 0.7)',
                border: `1px solid ${p.connection_status === 'CONNECTED' ? 'rgba(132,147,107,0.3)' : 'rgba(138,51,36,0.3)'}`,
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${p.connection_status === 'CONNECTED' ? 'var(--accent-olive)' : 'var(--error-color)'}`
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#F8F9FA', fontFamily: 'var(--font-serif)' }}>{p.display_name}</div>
                  <div style={{ fontSize: '9px', color: p.connection_status === 'CONNECTED' ? 'var(--accent-olive)' : '#8E989F', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {p.connection_status === 'CONNECTED' ? 'Online' : 'Offline'}
                    {p.is_host && <span style={{ color: 'var(--gold-soft)', marginLeft: '6px' }}>• Anfitrião</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleReady} style={{ justifyContent: 'center' }}>
            {isReady ? '✓ Estou pronto' : 'Marcar como pronto'}
          </button>
          {isHost ? (
            <button className="btn-primary" onClick={handleStart} disabled={players.length < 2}
              style={{ padding: '14px 24px', fontSize: '14px', justifyContent: 'center' }}>
              {players.length < 2 ? 'Aguardando Equipe...' : 'Iniciar Investigação'}
              <span style={{ color: 'var(--gold-soft)', marginLeft: '8px' }}>→</span>
            </button>
          ) : (
            <p style={{ textAlign: 'center', color: '#8E989F', fontStyle: 'italic', fontSize: '12px' }}>
              Aguardando o anfitrião iniciar...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
