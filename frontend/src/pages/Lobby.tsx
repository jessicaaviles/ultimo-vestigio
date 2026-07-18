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

  return (
    <div className="immersive-page is-fixed-height" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: `url(/backgrounds/lobby.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Overlay Escuro para Legibilidade */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(31,42,48,0.7) 0%, rgba(31,42,48,0.95) 100%)',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 24px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '4px', fontFamily: 'var(--font-serif)', lineHeight: 1.2 }}>
            Sala de Briefing · {roomData.case_version?.case_ref?.title || 'O Quarto 7'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>Aguardando os investigadores da equipe.</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Código:</div>
            <div style={{ fontSize: '18px', color: 'var(--accent-gold)', letterSpacing: '4px', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
              {roomData.public_code}
            </div>
          </div>
        </div>

        <div className="lobby-invite" style={{ marginBottom: '12px' }}><QRCodeCanvas value={`${window.location.origin}/join?room=${roomData.public_code}`} size={64} bgColor="#f2eee5" fgColor="#182126" /><div><span className="eyebrow">Convite</span><p style={{ fontSize: '11px' }}>Compartilhe o código ou o QR Code.</p><button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/join?room=${roomData.public_code}`)}>Copiar link</button></div></div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '11px', color: 'var(--accent-olive)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
            Equipe ({players.length}/{roomData.max_players})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {players.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: 'rgba(31,42,48,0.4)', borderRadius: '10px', border: `1px solid ${p.connection_status === 'CONNECTED' ? 'rgba(132,147,107,0.3)' : 'rgba(138,51,36,0.3)'}`, backdropFilter: 'blur(8px)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${p.connection_status === 'CONNECTED' ? 'var(--accent-olive)' : 'var(--error-color)'}` }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{p.display_name}</div>
                  <div style={{ fontSize: '10px', color: p.connection_status === 'CONNECTED' ? 'var(--accent-olive)' : 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {p.connection_status === 'CONNECTED' ? 'Online' : 'Offline'}
                    {p.is_host && <span style={{ color: 'var(--accent-gold)', marginLeft: '8px' }}>• Anfitrião</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-secondary lobby-ready" onClick={handleReady} style={{ marginBottom: 0 }}>{isReady ? 'Estou pronto' : 'Marcar como pronto'}</button>
          {isHost ? (
            <button className="btn-primary" onClick={handleStart} disabled={players.length < 2} style={{ padding: '14px 24px', fontSize: '14px' }}>
              {players.length < 2 ? 'Aguardando Equipe...' : 'Iniciar Investigação'}
              <span style={{ color: 'var(--accent-gold)' }}>→</span>
            </button>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>Aguardando o anfitrião iniciar...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
