import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as apiService from '../services/api';
import { Clock3, UsersRound } from 'lucide-react';

const CASES_MAP: Record<string, { title: string; synopsis: string; players: string; duration: string; image: string }> = {
  'o-quarto-7': {
    title: 'O Quarto 7',
    synopsis: 'Helena Duarte foi encontrada no Hotel Vesper. Uma chave, uma câmera e um relógio quebrado aguardam uma explicação.',
    players: '2-6 Jogadores',
    duration: '~20 min',
    image: '/capa_quarto_7.png'
  },
  'o-guarda-chuva-molhado': {
    title: 'O Guarda-chuva Molhado',
    synopsis: 'Uma pessoa entra em uma sala vazia e encontra um guarda-chuva completamente molhado. O céu está limpo e não choveu.',
    players: '2-6 Jogadores',
    duration: '~5 min',
    image: '/backgrounds/mapa-da-investigacao.png'
  },
  'o-presente-desaparecido': {
    title: 'O Presente Desaparecido',
    synopsis: 'Durante uma comemoração em família, um presente desaparece de uma mesa diante de todos. Ninguém saiu do ambiente.',
    players: '2-6 Jogadores',
    duration: '~8 min',
    image: '/backgrounds/cena-do-crime.png'
  },
  'o-elevador-que-nao-parou': {
    title: 'O Elevador que Não Parou',
    synopsis: 'Uma mulher entra sozinha em um elevador. Ele não para em nenhum andar e, quando retorna, está vazio.',
    players: '2-6 Jogadores',
    duration: '~12 min',
    image: '/backgrounds/lobby.png'
  },
  'a-mensagem-das-23h17': {
    title: 'A Mensagem das 23h17',
    synopsis: 'Às 23h17, uma pessoa envia uma mensagem dizendo: "Agora todos vão entender". Poucos minutos depois, desaparece.',
    players: '3-6 Jogadores',
    duration: '~15 min',
    image: '/backgrounds/equipe-investigadores.png'
  },
  'o-retrato-que-piscou': {
    title: 'O Retrato que Piscou',
    synopsis: 'Durante um jantar, todos veem o retrato antigo da sala piscar. Segundos depois, uma joia desaparece de uma mesa próxima.',
    players: '2-6 Jogadores',
    duration: '~12 min',
    image: '/capa_carta_anonima.png'
  }
};

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const location = useLocation();
  const query = new URLSearchParams(search);
  const selectedCaseId = query.get('caseId') || 'o-quarto-7';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState<number | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>((location.state as any)?.coverImage || null);

  const caseInfo = CASES_MAP[selectedCaseId] || CASES_MAP['o-quarto-7'];

  useEffect(() => {
    if (coverImage) return;
    apiService.generateCaseImage(selectedCaseId).then((res: any) => {
      if (res.success) setCoverImage(res.data.cover_image_data);
    }).catch(() => {});
  }, [selectedCaseId, coverImage]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      
      const hostName = localStorage.getItem('userName') || 'Investigador';
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError("Sua identidade local não está disponível. Retorne à Home.");
        return;
      }

      const response = await apiService.createRoom(selectedCaseId, userId, hostName, { turn_timer_seconds: timer });
      if (response && response.roomId) {
        navigate(`/room/${response.roomId}/recovery?code=${encodeURIComponent(response.recoveryCode || '')}&publicCode=${encodeURIComponent(response.publicCode || '')}&invite=${encodeURIComponent(response.inviteUrl || '')}`);
      }
    } catch (error) {
      console.error(error);
      setError('Não foi possível criar a sala. Nenhuma configuração foi perdida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="immersive-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      backgroundColor: '#0F1417',
      position: 'relative'
    }}>
      {/* Background fixo que cobre a tela inteira inclusive o padding do app-content */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundImage: `url(${coverImage || caseInfo.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0
      }}></div>
      {/* Overlay gradiente forte na parte inferior para a interface flutuar */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'linear-gradient(to bottom, rgba(15, 20, 23, 0.3) 0%, rgba(15, 20, 23, 0.95) 60%, #0F1417 100%)',
        zIndex: 0
      }}></div>

      {/* Bottom Sheet UI */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 88px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400 }}>Configurar Partida</h2>
        <p style={{ color: '#8E989F', fontSize: '14px', marginBottom: '32px', maxWidth: '85%', fontWeight: 300 }}>Um novo caso o aguarda. Escolha quem participará desta investigação.</p>

        <div style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
          <h5 style={{ color: '#C5A880', letterSpacing: '2px', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
            CASO SELECIONADO
          </h5>
          <h3 style={{ marginBottom: '12px', fontSize: '24px', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>{caseInfo.title}</h3>
          <p style={{ color: '#8E989F', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5, fontWeight: 300 }}>
            {caseInfo.synopsis}
          </p>
          
          <div style={{ display: 'flex', gap: '24px', fontSize: '10px', color: '#F8F9FA', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersRound size={14} color="var(--gold-soft)" /> {caseInfo.players}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock3 size={14} color="var(--gold-soft)" /> {caseInfo.duration}
            </div>
          </div>
          <label className="timer-setting">Tempo por turno<select value={timer ?? ''} onChange={(event) => setTimer(event.target.value ? Number(event.target.value) : null)}><option value="">Sem limite</option><option value="30">30 segundos</option><option value="60">60 segundos</option><option value="90">90 segundos</option></select></label>
        </div>

        {error && <div role="alert" style={{ color: '#d79b8e', marginBottom: '12px' }}>{error}</div>}
        <button 
          className="btn-primary" 
          onClick={handleCreate} 
          disabled={loading}
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
          {loading ? 'Preparando Sala...' : 'Criar Sala'}
          <span style={{ color: 'var(--gold-soft)', marginLeft: '8px' }}>→</span>
        </button>
      </div>
    </div>
  );
};

export default CreateRoom;
