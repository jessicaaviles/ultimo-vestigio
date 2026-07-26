import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../contexts/useSocket';
import Loading from '../components/Loading';

const Briefing: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [room, setRoom] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!socket || !roomId) return;
    const userId = localStorage.getItem('userId');
    const leaveStaleRoom = () => {
      localStorage.removeItem('currentRoomId');
      localStorage.removeItem('currentRoomCode');
      navigate('/cases', { replace: true });
    };
    const onState = (data: any) => {
      const stillInRoom = (data?.players || []).some((player: any) => player.anonymous_user_id === userId);
      if (!stillInRoom) {
        leaveStaleRoom();
        return;
      }
      setRoom(data);
    };
    const onRoomError = (err: string) => {
      if (String(err).includes('Você não está nesta sala')) leaveStaleRoom();
    };

    socket.emit('join_room', { roomId, userId });
    socket.on('room_state_updated', onState);
    socket.on('room_error', onRoomError);
    socket.on('left_room', leaveStaleRoom);
    return () => {
      socket.off('room_state_updated', onState);
      socket.off('room_error', onRoomError);
      socket.off('left_room', leaveStaleRoom);
    };
  }, [socket, roomId, navigate]);

  const confirm = () => {
    setReady(true);
    socket?.emit('player_ready', { roomId, userId: localStorage.getItem('userId'), ready: true });
  };

  if (!room) return <Loading message="Carregando apresentação..." />;

  const title = room.case_version?.case_ref?.title || 'O Quarto 7';
  const opening = room.case_version?.opening || 'O briefing deste caso ainda não está disponível.';
  const players = room.players || [];

  return (
    <div className="immersive-page is-fixed-height" style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0F1417',
      backgroundImage: `url(/backgrounds/cena-do-crime.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      position: 'relative'
    }}>
      {/* Overlay gradiente */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(15, 20, 23, 0.2) 0%, rgba(15, 20, 23, 0.9) 50%, #0F1417 100%)',
        zIndex: 0
      }}></div>

      {/* Conteúdo fixo no viewport */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        padding: '88px 24px calc(76px + env(safe-area-inset-bottom) + 24px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '16px'
      }}>

        {/* Cabeçalho */}
        <div>
          <span style={{ display: 'block', color: 'var(--eyebrow-gold)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Apresentação do caso
          </span>
          <h2 style={{ fontSize: '28px', margin: '0 0 6px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400, color: '#F8F9FA' }}>
            {title}
          </h2>
          <p style={{ color: '#8E989F', fontSize: '13px', lineHeight: 1.6, fontWeight: 300 }}>
            {opening}
          </p>
        </div>

        {/* Ponto de partida */}
        <div style={{
          padding: '14px 16px', borderRadius: '8px',
          backgroundColor: 'rgba(15, 20, 23, 0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{ display: 'block', color: 'var(--eyebrow-gold)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Ponto de partida
          </span>
          <p style={{ color: '#8E989F', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
            Observe cada resposta. O Mestre só conhece os fatos registrados neste dossiê.
          </p>
        </div>

        {/* Ordem de investigação */}
        {players.length > 0 && (
          <div>
            <span style={{ display: 'block', color: 'var(--eyebrow-gold)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Ordem de investigação
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {players.map((player: any, index: number) => (
                <div key={player.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '8px',
                  backgroundColor: 'rgba(15, 20, 23, 0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <span style={{ color: 'var(--gold-soft)', fontSize: '10px', fontWeight: 700, minWidth: '24px' }}>
                    0{index + 1}
                  </span>
                  <strong style={{ color: '#F8F9FA', fontSize: '13px', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
                    {player.display_name}
                  </strong>
                  {index === 0 && (
                    <span style={{ color: '#8E989F', fontSize: '10px', marginLeft: 'auto', fontStyle: 'italic' }}>
                      primeiro turno
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão */}
        <button
          className="btn-primary"
          onClick={() => { confirm(); navigate(`/room/${roomId}/game`); }}
          disabled={ready}
          style={{ padding: '16px 24px', fontSize: '14px', justifyContent: 'center' }}
        >
          {ready ? 'Aguardando equipe...' : 'Estou pronto'}
          {!ready && <span style={{ color: 'var(--gold-soft)', marginLeft: '8px' }}>→</span>}
        </button>
      </div>
    </div>
  );
};

export default Briefing;
