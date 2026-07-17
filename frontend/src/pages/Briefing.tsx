import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../contexts/useSocket';
import Loading from '../components/Loading';

const Briefing: React.FC = () => { const { roomId } = useParams(); const navigate = useNavigate(); const socket = useSocket(); const [room, setRoom] = useState<any>(null); const [ready, setReady] = useState(false);
  useEffect(() => { if (!socket || !roomId) return; const userId = localStorage.getItem('userId'); socket.emit('join_room', { roomId, userId }); const onState = (data: any) => setRoom(data); socket.on('room_state_updated', onState); return () => { socket.off('room_state_updated', onState); }; }, [socket, roomId]);
  const confirm = () => { setReady(true); socket?.emit('player_ready', { roomId, userId: localStorage.getItem('userId'), ready: true }); };
  if (!room) return <Loading message="Carregando apresentação..." />;
  const title = room.case_version?.case_ref?.title || 'O Quarto 7'; const opening = room.case_version?.opening || 'Helena Duarte foi encontrada no Hotel Vesper. Uma chave, uma câmera e um relógio quebrado aguardam uma explicação.';
  return <div className="briefing-page"><span className="eyebrow">Apresentação do caso</span><h1>{title}</h1><p className="briefing-opening">{opening}</p><div className="briefing-facts"><span className="eyebrow">Ponto de partida</span><p>Observe cada resposta. O Mestre só conhece os fatos registrados neste dossiê.</p></div><div className="turn-order"><span className="eyebrow">Ordem de investigação</span>{(room.players || []).map((player: any, index: number) => <div key={player.id}><span>0{index + 1}</span><strong>{player.display_name}</strong>{index === 0 && <small>primeiro turno</small>}</div>)}</div><button className="btn-primary" onClick={() => { confirm(); navigate(`/room/${roomId}/game`); }} disabled={ready}>{ready ? 'Aguardando equipe...' : 'Estou pronto'}</button></div>; };
export default Briefing;
