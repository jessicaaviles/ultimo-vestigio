import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/useSocket';
import { QRCodeCanvas } from 'qrcode.react';
import { getProfile } from '../services/api';
import Loading from '../components/Loading';

const Lobby: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [roomData, setRoomData] = useState<any>(null);
  const [startError, setStartError] = useState('');

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

    socket.on('room_error', (err: string) => {
      setStartError(String(err));
    });

    return () => {
      socket.off('room_state_updated');
      socket.off('game_started');
      socket.off('room_error');
    };
  }, [socket, roomId, navigate]);

  const [profileCache, setProfileCache] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!roomData?.players) return;
    roomData.players.forEach((p: any) => {
      const uid = p.anonymous_user_id;
      if (p.user || profileCache[uid]) return;
      getProfile(uid).then((res: any) => {
        if (res.success) {
          setProfileCache(prev => {
            if (prev[uid]) return prev;
            return { ...prev, [uid]: res.data };
          });
        }
      }).catch(() => {});
    });
  }, [roomData?.players]);

  const getPlayerDisplayName = (p: any) => {
    const isMe = p.anonymous_user_id === localStorage.getItem('userId');
    if (isMe) {
      const localName = localStorage.getItem('userName');
      if (localName) return localName;
    }
    const profile = p.user || profileCache[p.anonymous_user_id];
    return profile?.displayName || profile?.default_display_name || p.display_name;
  };

  const getPlayerPhoto = (p: any) => {
    const profile = p.user || profileCache[p.anonymous_user_id];
    return profile?.photo || profile?.generated_profile_photo_data || profile?.profile_photo_data || null;
  };

  if (!roomData) return <Loading message="Conectando à sala..." />;

  const players = roomData.players || [];
  const currentUserId = localStorage.getItem('userId');
  const isHost = players.some((p: any) => p.anonymous_user_id === currentUserId && p.is_host);
  const me = players.find((p: any) => p.anonymous_user_id === currentUserId);
  const isReady = me?.ready_status === 'READY';

  const handleStart = () => {
    socket?.emit('start_game', { roomId, userId: currentUserId });
  };

  const handleReady = () => {
    socket?.emit('player_ready', { roomId, userId: currentUserId, ready: !isReady });
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
                  width: '34px', height: '34px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${p.connection_status === 'CONNECTED' ? 'var(--accent-olive)' : 'var(--error-color)'}`
                }}>
                  {getPlayerPhoto(p) ? (
                    <img src={getPlayerPhoto(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#F8F9FA', fontFamily: 'var(--font-serif)' }}>{getPlayerDisplayName(p)}</div>
                  <div style={{ fontSize: '9px', color: p.ready_status === 'READY' ? 'var(--accent-olive)' : '#8E989F', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {p.ready_status === 'READY' ? '✅ Pronto' : 'Aguardando...'}
                    {p.is_host && <span style={{ color: 'var(--gold-soft)', marginLeft: '6px' }}>• Anfitrião</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {startError && (
          <div style={{ color: '#d79b8e', fontSize: '12px', textAlign: 'center', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(215,155,142,0.3)', background: 'rgba(215,155,142,0.08)' }}>
            {startError}
          </div>
        )}
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
