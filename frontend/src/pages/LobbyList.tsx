import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Key } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useSocket } from '../contexts/useSocket';

const LobbyList: React.FC = () => {
  const navigate = useNavigate();
  const { clearRooms } = useNotifications();
  const socket = useSocket();

  // Limpa o badge ao entrar na tela de salas
  useEffect(() => {
    clearRooms();
  }, [clearRooms]);

  // Escuta socket para novos convites/salas (outros arquivos podem emitir room_invited)
  useEffect(() => {
    // Nada a fazer aqui — o badge é setado externamente via setRoomsActivity
    return () => {};
  }, [socket]);

  return (
    <div className="lobby-list-page">
      <span className="eyebrow">Salas</span>
      <h1>Nenhuma sala ativa</h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, margin: '12px 0 32px', fontWeight: 300 }}>
        Você deve estar dentro de uma investigação ativa com a sua equipe para acessar a sala.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
        <button className="btn-primary" onClick={() => navigate('/cases')}>
          <Plus size={16} /> Criar nova sala
        </button>
        <button className="btn-secondary" onClick={() => navigate('/join')}>
          <Key size={16} /> Entrar com código
        </button>
      </div>
    </div>
  );
};

export default LobbyList;
