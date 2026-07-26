import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as apiService from '../services/api';
import { Clock3, UsersRound } from 'lucide-react';
import { getCaseCoverImage } from '../utils/caseAssets';

type CaseInfo = {
  title: string;
  synopsis: string;
  players: string;
  duration: string;
  image: string;
  available: boolean;
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
  const [coverImage] = useState<string | null>((location.state as any)?.coverImage || null);
  const [caseInfo, setCaseInfo] = useState<CaseInfo>({
    title: 'Carregando caso...',
    synopsis: 'Buscando as informações oficiais deste caso.',
    players: '--',
    duration: '--',
    image: '/backgrounds/mapa-da-investigacao.png',
    available: false
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    apiService.listCases(userId).then((response: any) => {
      const selectedCase = response?.data?.find((item: any) => item.slug === selectedCaseId);
      if (!selectedCase) {
        setCaseInfo({
          title: 'Caso indisponível',
          synopsis: 'Não encontramos este caso no arquivo ativo.',
          players: '--',
          duration: '--',
          image: '/backgrounds/mapa-da-investigacao.png',
          available: false
        });
        return;
      }

      setCaseInfo({
        title: selectedCase.title,
        synopsis: selectedCase.short_synopsis,
        players: `${selectedCase.min_players}-${selectedCase.max_players} Jogadores`,
        duration: `~${selectedCase.estimated_duration_minutes} min`,
        image: getCaseCoverImage(selectedCase.slug, selectedCase.cover_image_data),
        available: true
      });
    }).catch(() => {
      setCaseInfo({
        title: 'Caso indisponível',
        synopsis: 'Não foi possível carregar as informações oficiais deste caso.',
        players: '--',
        duration: '--',
        image: '/backgrounds/mapa-da-investigacao.png',
        available: false
      });
    });
  }, [selectedCaseId]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      if (!caseInfo.available) {
        setError('Este caso não está disponível para criar uma sala.');
        return;
      }
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError("Sua identidade local não está disponível. Retorne à Home.");
        return;
      }

      let hostName = localStorage.getItem('userName') || '';
      if (!hostName) {
        const profileRes = await apiService.getProfile(userId);
        if (profileRes.success) {
          hostName = profileRes.data.displayName;
          localStorage.setItem('userName', hostName);
        } else {
          hostName = 'Investigador';
        }
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
    <div className="immersive-page is-fixed-height" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
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
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, padding: '88px 24px calc(76px + env(safe-area-inset-bottom) + 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '20px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400 }}>Configurar Partida</h2>
        <p style={{ color: '#8E989F', fontSize: '14px', marginBottom: '32px', maxWidth: '85%', fontWeight: 300 }}>Um novo caso o aguarda. Escolha quem participará desta investigação.</p>

        <div style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
          <h5 style={{ color: 'var(--eyebrow-gold)', letterSpacing: '2px', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
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
          disabled={loading || !caseInfo.available}
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
