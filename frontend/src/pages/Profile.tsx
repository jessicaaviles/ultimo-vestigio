import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Camera, Check, Download, Edit3, LogOut, Mail, Trash2, Upload, UserPlus, X, Medal, Shield, Search, Star, Trophy, Lock, FileText, Crosshair, RotateCcw } from 'lucide-react';
import { getProfile, updateProfile, deleteProfile, authValidate, authLogout, resetProfilePortraitGenerations } from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';
import { applyProgressReset } from '../utils/progressReset';

const guestAvatar = '/backgrounds/guest-investigator-avatar.png';

interface ProfileData {
  id: string;
  displayName: string;
  bio: string;
  active: boolean;
  photo: string | null;
  hasGeneratedPortrait: boolean;
  hasProfile: boolean;
  photoUpdatedAt?: string | null;
  portraitGenerations: number;
  portraitGenerationsRemaining: number;
  stats?: {
    hostedRoomsCount: number;
    playedRoomsCount: number;
    theoriesCount: number;
    correctTheoriesCount: number;
  };
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('Agente');
  const [bio, setBio] = useState('');
  const [active, setActive] = useState(true);
  const [photoData, setPhotoData] = useState('');
  const [preview, setPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [photoViewer, setPhotoViewer] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitLoadingMessage, setPortraitLoadingMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [resettingPortraits, setResettingPortraits] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoSheetStatus, setPhotoSheetStatus] = useState('');
  const [capturedSelfie, setCapturedSelfie] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const fetchSeqRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const portraitRefreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (editing && bioInputRef.current) {
      const el = bioInputRef.current;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [editing]);

  useEffect(() => {
    return () => {
      if (portraitRefreshTimerRef.current) {
        window.clearTimeout(portraitRefreshTimerRef.current);
      }
    };
  }, []);

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    setCameraReady(false);
  };

  useEffect(() => {
    if (!photoSheetOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;
    setCameraError('');
    setCameraReady(false);
    setPhotoSheetStatus('');
    setCapturedSelfie('');

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Câmera indisponível neste navegador.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setCameraError('Não foi possível abrir a câmera.');
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [photoSheetOpen]);

  useEffect(() => {
    if (!authToken) { setLoading(false); return; }
    const seq = ++fetchSeqRef.current;

    (async () => {
      setLoading(true);
      try {
        const res = await authValidate(authToken);
        if (seq !== fetchSeqRef.current) return;
        if (res.success) {
          setAuthEmail(res.data.email || null);
          const profileRes = await getProfile(res.data.userId);
          if (seq !== fetchSeqRef.current) return;
          if (profileRes.success) {
            const visibleProfile = applyProgressReset(profileRes.data, res.data.userId);
            setProfile(visibleProfile);
            setName(visibleProfile.displayName);
            localStorage.setItem('userName', visibleProfile.displayName);
            setBio(visibleProfile.bio);
            setActive(visibleProfile.active);
          } else {
            setStatus('Perfil não encontrado.');
          }
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          setAuthToken(null);
        }
      } catch {
        if (seq !== fetchSeqRef.current) return;
        setStatus('Não foi possível carregar o perfil.');
      } finally {
        if (seq === fetchSeqRef.current) setLoading(false);
      }
    })();
  }, [authToken]);

  const handleLogout = async () => {
    if (authToken) await authLogout(authToken);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setAuthToken(null);
    setProfile(null);
    setStatus('Você saiu da sua conta.');
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id || !authToken) return;
    setDeletingAccount(true);
    setStatus('');
    try {
      const response = await deleteProfile(profile.id, authToken);
      if (!response.success) throw new Error(response.error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      setAuthToken(null);
      setProfile(null);
      setDeleteConfirmOpen(false);
      await refresh();
      navigate('/register', { replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível excluir a conta.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleResetPortraitGenerations = async () => {
    if (!profile?.id || !authToken) return;
    setResettingPortraits(true);
    setStatus('');
    setPhotoSheetStatus('');
    try {
      const response = await resetProfilePortraitGenerations(profile.id, authToken);
      if (!response.success) throw new Error(response.error);
      setProfile(response.data);
      setPhotoData('');
      setPreview('');
      const message = 'Gerações de imagem de perfil resetadas. Você tem 3/3 disponíveis.';
      if (photoSheetOpen) setPhotoSheetStatus(message);
      else setStatus(message);
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível resetar as gerações.';
      if (photoSheetOpen) setPhotoSheetStatus(message);
      else setStatus(message);
    } finally {
      setResettingPortraits(false);
    }
  };

  const handleDownloadPhoto = () => {
    const img = profile?.photo;
    if (!img) return;
    const link = document.createElement('a');
    link.href = img;
    link.download = `perfil-${profile.displayName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const schedulePortraitRefresh = (userId: string, attempt = 1) => {
    if (portraitRefreshTimerRef.current) window.clearTimeout(portraitRefreshTimerRef.current);
    const messages = [
      'Analisando selfie',
      'Criando retrato',
      'Ajustando luz',
      'Finalizando imagem',
    ];
    setPortraitLoadingMessage(messages[Math.min(messages.length - 1, Math.floor((attempt - 1) / 3))]);
    portraitRefreshTimerRef.current = window.setTimeout(() => {
      void (async () => {
        const profileRes = await getProfile(userId);
        if (profileRes.success) {
          const visibleProfile = applyProgressReset(profileRes.data, userId);
          setProfile(visibleProfile);
          setName(visibleProfile.displayName);
          setBio(visibleProfile.bio);
          setActive(visibleProfile.active);
          if (visibleProfile.hasGeneratedPortrait) {
            setGeneratingPortrait(false);
            setPortraitLoadingMessage('');
            setStatus('Retrato gerado com sucesso!');
            await refresh();
            return;
          }
        }
        if (attempt < 15) {
          schedulePortraitRefresh(userId, attempt + 1);
        } else {
          setGeneratingPortrait(false);
          setPortraitLoadingMessage('');
          setStatus('Sua selfie foi salva. O retrato ainda está sendo processado.');
          await refresh();
        }
      })();
    }, attempt <= 4 ? 1500 : 3000);
  };

  const save = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!profile?.id || !authToken) return;
    const hasPhoto = Boolean(photoData || preview);
    setSaving(true);
    setStatus(hasPhoto ? 'Gerando retrato…' : 'Salvando perfil…');
    if (hasPhoto) {
      setGeneratingPortrait(true);
      setPortraitLoadingMessage('Enviando selfie');
    }
    let keepPortraitLoading = false;
    try {
      const response = await updateProfile(profile.id, {
        displayName: name, bio, active,
        photoData: photoData || undefined,
        generatePortrait: Boolean(photoData),
      });
      if (!response.success) throw new Error(response.error);
      setProfile(response.data);
      setName(response.data.displayName);
      localStorage.setItem('userName', response.data.displayName);
      setBio(response.data.bio);
      setActive(response.data.active);
      setPhotoData('');
      setPreview('');
      setEditing(false);
      await refresh();
      const genStatus = (response as any).portraitStatus;
      if (hasPhoto && genStatus === 'READY') setStatus('Perfil salvo! Retrato gerado com sucesso.');
      else if (hasPhoto && genStatus === 'GENERATING') {
        setStatus('Perfil salvo. O retrato será atualizado em instantes.');
        keepPortraitLoading = true;
        schedulePortraitRefresh(profile.id);
      }
      else if (hasPhoto && genStatus === 'UNAVAILABLE') setStatus('Perfil salvo, mas o retrato não pôde ser gerado no momento.');
      else setStatus('Perfil salvo com sucesso!');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
      if (!keepPortraitLoading) setGeneratingPortrait(false);
      if (!keepPortraitLoading) setPortraitLoadingMessage('');
    }
  };

  const submitProfilePhoto = async (value: string) => {
    if ((profile?.portraitGenerationsRemaining ?? 3) <= 0) {
      const message = 'Limite de retratos atingido (máximo 3).';
      if (photoSheetOpen) setPhotoSheetStatus(message);
      else setStatus(message);
      return;
    }
    setPhotoSheetOpen(false);
    setPhotoData(value);
    setPreview(value);
    setStatus('Gerando retrato…');
    setGeneratingPortrait(true);
    setPortraitLoadingMessage('Enviando selfie');
    if (profile?.id && authToken) {
      let keepPortraitLoading = false;
      try {
        const response = await updateProfile(profile.id, {
          displayName: name, bio, active,
          photoData: value,
          generatePortrait: true,
        });
        if (!response.success) throw new Error(response.error);
        setProfile(response.data);
        setName(response.data.displayName);
        setBio(response.data.bio);
        setActive(response.data.active);
        setPhotoData('');
        setPreview('');
        await refresh();
        const genStatus = (response as any).portraitStatus;
        if (genStatus === 'READY') setStatus('Retrato gerado com sucesso!');
        else if (genStatus === 'GENERATING') {
          setStatus('Sua selfie foi enviada. O retrato aparecerá em instantes.');
          keepPortraitLoading = true;
          schedulePortraitRefresh(profile.id);
        }
        else if (genStatus === 'UNAVAILABLE') setStatus('Não foi possível gerar o retrato no momento.');
        else setStatus('Perfil salvo com sucesso!');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Erro ao gerar retrato.');
      } finally {
        if (!keepPortraitLoading) {
          setGeneratingPortrait(false);
          setPortraitLoadingMessage('');
        }
      }
    }
  };

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      const message = 'Use uma imagem JPG, PNG ou WEBP de até 4 MB.';
      if (photoSheetOpen) setPhotoSheetStatus(message);
      else setStatus(message);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void submitProfilePhoto(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !cameraReady || video.readyState < 2) {
      setPhotoSheetStatus('A câmera ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }
    const canvas = document.createElement('canvas');
    const videoWidth = video.videoWidth || 720;
    const videoHeight = video.videoHeight || 720;
    const size = Math.min(videoWidth, videoHeight);
    const sx = Math.max(0, (videoWidth - size) / 2);
    const sy = Math.max(0, (videoHeight - size) / 2);
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setPhotoSheetStatus('Não foi possível capturar a foto.');
      return;
    }
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    setCapturedSelfie(canvas.toDataURL('image/jpeg', 0.9));
    setPhotoSheetStatus('Confira a foto antes de enviar para gerar seu retrato.');
  };

  const startEditing = () => {
    if (profile) {
      setName(profile.displayName);
      setBio(profile.bio);
      setActive(profile.active);
    }
    setEditing(true);
    setStatus('');
  };

  const image = preview || profile?.photo;
  const stats = profile?.stats;
  const playedRoomsCount = stats?.playedRoomsCount ?? 0;
  const hostedRoomsCount = stats?.hostedRoomsCount ?? 0;
  const theoriesCount = stats?.theoriesCount ?? 0;
  const correctTheoriesCount = stats?.correctTheoriesCount ?? 0;
  const theoryAccuracy = theoriesCount > 0 ? Math.round((correctTheoriesCount / theoriesCount) * 100) : null;
  const achievementItems = [
    {
      id: 'first_case',
      title: 'Primeiro caso',
      desc: 'Complete sua primeira investigação.',
      unlocked: playedRoomsCount >= 1,
      progress: `${Math.min(playedRoomsCount, 1)} / 1`,
      progressPercent: Math.min(playedRoomsCount, 1) * 100,
      points: 50,
      tier: 'bronze',
      tierLabel: 'Bronze',
      Icon: Search,
    },
    {
      id: 'veteran',
      title: 'Investigador consistente',
      desc: 'Participe de 5 investigações.',
      unlocked: playedRoomsCount >= 5,
      progress: `${Math.min(playedRoomsCount, 5)} / 5`,
      progressPercent: Math.min(playedRoomsCount / 5, 1) * 100,
      points: 150,
      tier: 'silver',
      tierLabel: 'Prata',
      Icon: Medal,
    },
    {
      id: 'host',
      title: 'Criação de sala',
      desc: 'Crie uma sala concluída.',
      unlocked: hostedRoomsCount >= 1,
      progress: `${Math.min(hostedRoomsCount, 1)} / 1`,
      progressPercent: Math.min(hostedRoomsCount, 1) * 100,
      points: 80,
      tier: 'bronze',
      tierLabel: 'Bronze',
      Icon: Shield,
    },
    {
      id: 'theorist',
      title: 'Teoria em campo',
      desc: 'Registre sua primeira teoria.',
      unlocked: theoriesCount >= 1,
      progress: `${Math.min(theoriesCount, 1)} / 1`,
      progressPercent: Math.min(theoriesCount, 1) * 100,
      points: 60,
      tier: 'bronze',
      tierLabel: 'Bronze',
      Icon: FileText,
    },
    {
      id: 'deduction',
      title: 'Dedução correta',
      desc: 'Acerte uma teoria final.',
      unlocked: correctTheoriesCount >= 1,
      progress: `${Math.min(correctTheoriesCount, 1)} / 1`,
      progressPercent: Math.min(correctTheoriesCount, 1) * 100,
      points: 120,
      tier: 'silver',
      tierLabel: 'Prata',
      Icon: Star,
    },
    {
      id: 'precision',
      title: 'Precisão de elite',
      desc: 'Alcance 80% de precisão com 3 teorias.',
      unlocked: theoriesCount >= 3 && (theoryAccuracy ?? 0) >= 80,
      progress: `${Math.min(theoriesCount, 3)} / 3 teorias`,
      progressPercent: Math.min(theoriesCount / 3, (theoryAccuracy ?? 0) / 80, 1) * 100,
      points: 200,
      tier: 'gold',
      tierLabel: 'Ouro',
      Icon: Crosshair,
    },
  ];
  const unlockedAchievements = achievementItems.filter((achievement) => achievement.unlocked).length;
  const totalAchievementPoints = achievementItems
    .filter((achievement) => achievement.unlocked)
    .reduce((total, achievement) => total + achievement.points, 0);
  const achievementCompletion = Math.round((unlockedAchievements / achievementItems.length) * 100);
  const hasAchievementProgress = playedRoomsCount > 0 || hostedRoomsCount > 0 || theoriesCount > 0 || correctTheoriesCount > 0;
  const canResetPortraitGenerations = authEmail?.trim().toLowerCase() === 'jessica.aviles16@gmail.com';

  if (!authToken) {
    return (
      <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="profile-hero" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <img src={guestAvatar} alt="Visitante" />
            </div>
          </div>
          <h1 style={{ margin: 0 }}>Último Vestígio</h1>
          <p style={{ color: '#94A3B8', maxWidth: 400 }}>
            Crie sua conta para participar das investigações e salvar seu progresso no jogo.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={18} /> Criar Conta
            </button>
            <button className="btn-secondary" onClick={() => navigate('/login')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Loading message="Carregando perfil..." />;

  return (
    <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="profile-hero">
        <div className="profile-avatar-wrap" style={{ position: 'relative' }}>
          <div
            className={`profile-avatar${generatingPortrait ? ' profile-avatar--generating' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (image) setPhotoViewer(true);
              else setPhotoSheetOpen(true);
            }}
          >
            {image ? <img src={image} alt={`Retrato de ${name}`} /> : <Upload size={24} strokeWidth={1.3} />}
            {generatingPortrait && (
              <div className="profile-avatar-loading" aria-live="polite">
                <div className="profile-avatar-spinner" />
                <span>{portraitLoadingMessage || 'Gerando'}</span>
              </div>
            )}
          </div>
          {profile?.hasGeneratedPortrait && <span className="portrait-badge" title="Retrato gerado pela IA"><Check size={12} /></span>}
          {profile?.portraitGenerationsRemaining !== undefined && (
            <span style={{ position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {profile.portraitGenerationsRemaining}/3 gerações
            </span>
          )}
        </div>
        <div>
          <span className="eyebrow">Arquivo do investigador</span>
          {editing ? (
            <textarea value={name} onChange={(e) => setName(e.target.value)} maxLength={32} rows={2} required style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 5px', padding: 0, border: 'none', borderBottom: '1px solid var(--gold)', background: 'transparent', color: '#F8F9FA', width: '100%', outline: 'none', lineHeight: 1.2, boxSizing: 'border-box', resize: 'none' }} />
          ) : (
            <h1 style={{ margin: '0 0 5px', lineHeight: 1.2, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{profile?.displayName || name}</h1>
          )}
          {editing ? (
            <textarea ref={bioInputRef} value={bio} onChange={(e) => { setBio(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }} maxLength={280} rows={1} placeholder="Como você investiga?" style={{ color: 'var(--muted)', maxWidth: 440, fontSize: 14, margin: 0, padding: 0, border: 'none', borderBottom: '1px solid var(--gold)', background: 'transparent', resize: 'none', width: '100%', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box', overflow: 'hidden' }} />
          ) : (
            <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word', color: 'var(--muted)', maxWidth: 440, fontSize: 14, fontFamily: 'inherit' }}>{profile?.bio || 'Ainda sem descrição.'}</p>
          )}
        </div>
        {!editing && (
          <button className="btn-secondary profile-edit-trigger" onClick={startEditing}>
            <Edit3 size={15} /> Editar perfil
          </button>
        )}
      </div>



      {editing && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? (photoData ? 'Gerando retrato…' : 'Salvando…') : 'Salvar perfil'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setName(profile?.displayName || 'Agente'); setBio(profile?.bio || ''); setPhotoData(''); setPreview(''); }} disabled={saving}>
            Cancelar
          </button>
        </div>
      )}

      {status && <div className="profile-status" role="status">{status}</div>}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} style={{ display: 'none' }} />

      {editing && (
        <form className="profile-form" onSubmit={save}>
          <label className="profile-toggle">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Perfil ativo para a equipe
          </label>
        </form>
      )}

      <section className="profile-section" style={{ marginTop: 32 }}>
        <span className="eyebrow">Marcas de campo</span>
        <h2>Conquistas</h2>
        {profile?.stats && hasAchievementProgress ? (
          <div className="profile-achievement-panel">
            <div className="profile-achievement-summary">
              <div className="profile-achievement-overview">
                <div
                  className="profile-achievement-ring"
                  style={{ '--achievement-progress': `${achievementCompletion * 3.6}deg` } as React.CSSProperties}
                  aria-label={`${achievementCompletion}% das conquistas desbloqueadas`}
                >
                  <span>{achievementCompletion}%</span>
                </div>
                <div>
                  <strong>{unlockedAchievements} de {achievementItems.length}</strong>
                  <span>jornada concluída</span>
                </div>
              </div>
              <div className="profile-achievement-summary-stat">
                <Trophy size={20} />
                <strong>{unlockedAchievements}</strong>
                <span>desbloqueadas</span>
              </div>
              <div className="profile-achievement-summary-stat">
                <Medal size={20} />
                <strong>{totalAchievementPoints}</strong>
                <span>pontos</span>
              </div>
              <div className="profile-achievement-summary-stat">
                <Crosshair size={20} />
                <strong>{theoryAccuracy === null ? '—' : `${theoryAccuracy}%`}</strong>
                <span>precisão</span>
              </div>
            </div>

            <div className="profile-achievement-list">
              {achievementItems.map((achievement) => (
                <article
                  key={achievement.id}
                  className={`profile-achievement-card profile-achievement-card--${achievement.tier}${achievement.unlocked ? ' profile-achievement-card--unlocked' : ''}`}
                >
                  <div className="profile-achievement-medal-wrap" aria-hidden="true">
                    <div className="profile-achievement-medal">
                      <achievement.Icon size={29} strokeWidth={1.45} />
                    </div>
                    {!achievement.unlocked && (
                      <span className="profile-achievement-lock"><Lock size={11} strokeWidth={2.4} /></span>
                    )}
                  </div>
                  <div className="profile-achievement-copy">
                    <div className="profile-achievement-heading">
                      <span className="profile-achievement-tier">{achievement.tierLabel}</span>
                      <span className="profile-achievement-points">+{achievement.points} pts</span>
                    </div>
                    <div className="profile-achievement-title-row">
                      <h3>{achievement.title}</h3>
                      {achievement.unlocked && <Check size={16} aria-label="Conquista desbloqueada" />}
                    </div>
                    <p>{achievement.desc}</p>
                    <div className="profile-achievement-progress-row">
                      <div
                        className="profile-achievement-progress"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(achievement.progressPercent)}
                        aria-label={`Progresso de ${achievement.title}`}
                      >
                        <span style={{ width: `${achievement.progressPercent}%` }} />
                      </div>
                      <span>{achievement.unlocked ? 'Conquistada' : achievement.progress}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : profile?.stats ? (
          <div className="home-empty-stats">
            <div className="home-empty-stats-icon">
              <Trophy size={22} />
            </div>
            <div className="home-empty-stats-copy">
              <h4>Nenhuma conquista ainda</h4>
              <p>Suas badges aparecem aqui depois que você avançar em casos, teorias e salas.</p>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '24px 0' }}>Carregando histórico do detetive...</p>
        )}
      </section>

      <section className="profile-section" style={{ marginTop: 32 }}>
        <span className="eyebrow">Conta</span>
        <div className="profile-account-panel">
          {authEmail && (
            <div className="profile-account-email">
              <Mail size={16} /> {authEmail}
            </div>
          )}
          <div className="profile-account-actions">
            <button className="btn-danger profile-delete-trigger" onClick={() => setDeleteConfirmOpen(true)} disabled={deletingAccount}>
              <Trash2 size={14} /> Excluir conta
            </button>
            <button className="btn-secondary profile-logout-trigger" onClick={handleLogout}>
              <LogOut size={14} /> Sair da conta
            </button>
            {canResetPortraitGenerations && (
              <button className="btn-secondary profile-reset-portraits-trigger" onClick={handleResetPortraitGenerations} disabled={resettingPortraits}>
                <RotateCcw size={14} /> {resettingPortraits ? 'Resetando...' : 'Resetar gerações de foto'}
              </button>
            )}
          </div>
        </div>
      </section>

      {photoViewer && profile?.photo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 200, backgroundColor: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', gap: '24px',
        }} onClick={() => setPhotoViewer(false)}>
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 12 }}>
            <button onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Download size={16} /> Salvar imagem
            </button>
            <button aria-label="Fechar visualizador de foto" onClick={() => setPhotoViewer(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: 10, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ width: 'min(86vw, 520px)', aspectRatio: '1 / 1', maxHeight: '64vh', borderRadius: 18, backgroundImage: `url(${profile.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: 'transparent', boxShadow: '0 22px 70px rgba(0,0,0,.42)', border: '1px solid rgba(245,214,129,.22)' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPhotoViewer(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button onClick={() => { setPhotoViewer(false); setPhotoSheetOpen(true); }} style={{ background: 'var(--accent-gold)', border: '1px solid rgba(245,214,129,.55)', color: '#0A0D10', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800 }}>
              <Upload size={16} /> Enviar nova foto
            </button>
          </div>
        </div>
      )}

      {photoSheetOpen && (
        <div
          role="presentation"
          onClick={() => setPhotoSheetOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 240,
            display: 'flex',
            alignItems: 'flex-end',
            background: 'rgba(4,7,9,.72)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-sheet-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              minHeight: '330px',
              padding: '14px 22px calc(22px + env(safe-area-inset-bottom))',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,.08)',
              background: 'linear-gradient(180deg, rgba(35,37,38,.98), rgba(20,23,24,.98))',
              boxShadow: '0 -22px 70px rgba(0,0,0,.45)'
            }}
          >
            <button
              aria-label="Fechar seleção de foto"
              onClick={() => setPhotoSheetOpen(false)}
              style={{ width: 42, height: 4, display: 'block', margin: '0 auto 20px', padding: 0, border: 0, borderRadius: 999, background: 'rgba(255,255,255,.16)', cursor: 'pointer' }}
            />
            <h2 id="photo-sheet-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Adicionar foto de perfil</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              <button
                type="button"
                onClick={(event) => event.preventDefault()}
                onPointerUp={(event) => {
                  event.preventDefault();
                  if (!generatingPortrait && !capturedSelfie) captureSelfie();
                }}
                disabled={generatingPortrait}
                style={{
                  width: 112,
                  height: 112,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 24,
                  border: '1px solid rgba(197,168,128,.35)',
                  background: 'rgba(10,13,16,.72)',
                  color: '#fff',
                  cursor: generatingPortrait ? 'default' : 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                {capturedSelfie ? (
                  <img
                    src={capturedSelfie}
                    alt="Selfie capturada"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    onLoadedMetadata={() => setCameraReady(true)}
                    onCanPlay={() => setCameraReady(true)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', pointerEvents: 'none' }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, width: 38, height: 38, display: capturedSelfie ? 'none' : 'grid', placeItems: 'center', borderRadius: '50%', color: '#0A0D10', background: 'rgba(242,238,229,.92)', boxShadow: '0 8px 20px rgba(0,0,0,.22)' }}>
                  <Camera size={20} />
                </span>
              </button>
              {capturedSelfie && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => void submitProfilePhoto(capturedSelfie)}
                    disabled={generatingPortrait}
                    style={{
                      minHeight: 44,
                      borderRadius: 10,
                      border: '1px solid rgba(245,214,129,.55)',
                      background: 'var(--accent-gold)',
                      color: '#0A0D10',
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Usar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedSelfie('');
                      setPhotoSheetStatus('');
                    }}
                    disabled={generatingPortrait}
                    style={{
                      minHeight: 44,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(255,255,255,.045)',
                      color: 'var(--paper)',
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Tirar outra
                  </button>
                </div>
              )}
              {cameraError && <p style={{ margin: '-12px 0 0', color: 'rgba(242,238,229,.56)', fontSize: 12 }}>{cameraError}</p>}
              {photoSheetStatus && (
                <div
                  role="status"
                  style={{
                    margin: '-8px 0 0',
                    padding: '11px 12px',
                    display: 'grid',
                    gap: 10,
                    color: 'var(--gold-soft)',
                    border: '1px solid rgba(184,153,83,.35)',
                    borderRadius: 10,
                    background: 'rgba(184,153,83,.08)',
                    fontSize: 12,
                    lineHeight: 1.4
                  }}
                >
                  <span>{photoSheetStatus}</span>
                  {canResetPortraitGenerations && photoSheetStatus.includes('Limite de retratos') && (
                    <button
                      type="button"
                      onClick={handleResetPortraitGenerations}
                      disabled={resettingPortraits}
                      style={{
                        minHeight: 38,
                        borderRadius: 8,
                        border: '1px solid rgba(245,214,129,.55)',
                        background: 'var(--accent-gold)',
                        color: '#0A0D10',
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {resettingPortraits ? 'Resetando...' : 'Resetar limite'}
                    </button>
                  )}
                </div>
              )}
              <div style={{ display: 'grid', overflow: 'hidden', borderRadius: 22, background: 'rgba(255,255,255,.045)' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={generatingPortrait}
                  style={{ minHeight: 68, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 16, border: 0, background: 'transparent', color: 'var(--paper)', cursor: generatingPortrait ? 'default' : 'pointer', fontSize: 15, fontWeight: 800, textAlign: 'left' }}
                >
                  <Upload size={22} /> Escolher na galeria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="profile-delete-modal-backdrop" role="presentation" onClick={() => !deletingAccount && setDeleteConfirmOpen(false)}>
          <div className="profile-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(event) => event.stopPropagation()}>
            <div className="profile-delete-modal-icon" aria-hidden="true">
              <AlertTriangle size={22} strokeWidth={1.7} />
            </div>
            <div>
              <span className="eyebrow">Exclusão permanente</span>
              <h2 id="delete-account-title">Excluir sua conta?</h2>
              <p>
                Seu cadastro será removido, seus dados de perfil serão apagados e o contador de retratos será reiniciado. Ao criar uma nova conta, você poderá gerar 3 imagens novamente.
              </p>
            </div>
            <div className="profile-delete-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deletingAccount}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteAccount} disabled={deletingAccount}>
                <Trash2 size={15} /> {deletingAccount ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
