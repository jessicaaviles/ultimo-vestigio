import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Download, Edit3, LogOut, Mail, UserPlus, X } from 'lucide-react';
import { getProfile, updateProfile, registerAnonymousUser, authValidate, authLogin, authLogout, authLink } from '../services/api';
import Loading from '../components/Loading';

interface ProfileData {
  id: string;
  displayName: string;
  bio: string;
  active: boolean;
  photo: string | null;
  hasGeneratedPortrait: boolean;
  hasProfile: boolean;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('Investigador');
  const [bio, setBio] = useState('');
  const [active, setActive] = useState(true);
  const [photoData, setPhotoData] = useState('');
  const [preview, setPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [photoViewer, setPhotoViewer] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const savingRef = useRef(false);
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    const seq = ++fetchSeqRef.current;

    (async () => {
      let currentUserId = userId;

      /* Phase 1: resolve userId */
      if (authToken) {
        const res = await authValidate(authToken);
        if (seq !== fetchSeqRef.current) return;
        if (res.success) {
          currentUserId = res.data.userId;
          setAuthEmail(res.data.email || null);
        } else {
          localStorage.removeItem('authToken');
          setAuthToken(null);
          setLoading(false);
          return;
        }
      } else if (!userId) {
        try {
          const res = await registerAnonymousUser();
          if (seq !== fetchSeqRef.current) return;
          if (res.success) {
            currentUserId = res.data.userId;
            localStorage.setItem('deviceToken', res.data.deviceToken);
            localStorage.setItem('userId', currentUserId);
          } else {
            setLoading(false);
            return;
          }
        } catch {
          if (seq !== fetchSeqRef.current) return;
          setStatus('Não foi possível registrar seu perfil temporário.');
          setLoading(false);
          return;
        }
      }

      /* Phase 2: load profile */
      if (!currentUserId) { setLoading(false); return; }
      if (savingRef.current) { setLoading(false); return; }
      setLoading(true);
      try {
        const response = await getProfile(currentUserId);
        if (seq !== fetchSeqRef.current) return;
        if (response.success) {
          setProfile(response.data);
          setName(response.data.displayName);
          setBio(response.data.bio);
          setActive(response.data.active);
        } else {
          setProfile({ id: currentUserId, displayName: 'Investigador', bio: '', active: true, photo: null, hasGeneratedPortrait: false, hasProfile: false });
        }
      } catch {
        if (seq !== fetchSeqRef.current) return;
        setStatus('Não foi possível carregar o perfil.');
        setProfile({ id: currentUserId, displayName: 'Investigador', bio: '', active: true, photo: null, hasGeneratedPortrait: false, hasProfile: false });
      }

      if (currentUserId !== userId) {
        localStorage.setItem('userId', currentUserId);
        setUserId(currentUserId);
      }
      setLoading(false);
    })();
  }, [authToken, userId]);

  const handleLogout = async () => {
    if (authToken) await authLogout(authToken);
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setAuthEmail(null);
    setStatus('Você saiu da sua conta.');
  };

  const handleLink = async () => {
    if (!userId) return;
    const email = window.prompt('Digite seu email para vincular este perfil:');
    if (!email) return;
    const password = window.prompt('Digite uma senha (mínimo 6 caracteres):');
    if (!password || password.length < 6) return setStatus('A senha deve ter pelo menos 6 caracteres.');
    setSaving(true);
    try {
      const res = await authLink(email, password, userId);
      if (res.success) {
        localStorage.setItem('authToken', res.data.authToken);
        setAuthToken(res.data.authToken);
        setAuthEmail(email);
        setStatus('Perfil vinculado com sucesso! Agora você pode acessá-lo de qualquer dispositivo.');
      } else {
        setStatus(res.error || 'Erro ao vincular perfil.');
      }
    } catch {
      setStatus('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await authLogin(loginEmail, loginPassword);
      if (res.success) {
        localStorage.setItem('authToken', res.data.authToken);
        localStorage.setItem('userId', res.data.userId);
        setAuthToken(res.data.authToken);
        setAuthEmail(loginEmail);
        setUserId(res.data.userId);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(res.error || 'Erro ao entrar.');
      }
    } catch {
      setLoginError('Erro de conexão.');
    } finally {
      setLoginLoading(false);
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

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024)
      return setStatus('Use uma imagem JPG, PNG ou WEBP de até 4 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      setPhotoData(value);
      setPreview(value);
      setStatus('');
    };
    reader.readAsDataURL(file);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    savingRef.current = true;
    setSaving(true);
    setStatus('Salvando perfil...');
    try {
      let currentUserId = userId;
      let response = await updateProfile(currentUserId, {
        displayName: name, bio, active,
        photoData: photoData || undefined,
        generatePortrait: Boolean(photoData),
      });
      if (!response.success && response.error === 'Profile not found') {
        const reg = await registerAnonymousUser();
        if (reg.success) {
          currentUserId = reg.data.userId;
          localStorage.setItem('userId', reg.data.userId);
          localStorage.setItem('deviceToken', reg.data.deviceToken);
          setUserId(reg.data.userId);
          response = await updateProfile(currentUserId, {
            displayName: name, bio, active,
            photoData: photoData || undefined,
            generatePortrait: Boolean(photoData),
          });
        }
      }
      if (!response.success) throw new Error(response.error);
      setProfile(response.data);
      setName(response.data.displayName);
      setBio(response.data.bio);
      setActive(response.data.active);
      setPhotoData('');
      setPreview('');
      setEditing(false);
      setStatus('Perfil salvo com sucesso!');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
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

  if (loading) {
    return <Loading message="Carregando perfil..." />;
  }

  if (profile && !profile.hasProfile && !editing) {
    return (
      <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="profile-hero" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <Camera size={32} strokeWidth={1.3} />
            </div>
          </div>
          <h1 style={{ margin: 0 }}>Criar Perfil de Investigador</h1>
          <p style={{ color: '#94A3B8', maxWidth: 400 }}>
            Você ainda não possui um perfil. Crie seu perfil para participar das investigações.
          </p>
          <button className="btn-primary" onClick={startEditing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} /> Criar Perfil
          </button>
        </div>
        {status && <div className="profile-status" role="status">{status}</div>}
      </div>
    );
  }

  return (
    <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" style={{ cursor: image ? 'pointer' : 'default' }} onClick={() => image && setPhotoViewer(true)}>
            {image ? <img src={image} alt={`Retrato de ${name}`} /> : <Camera size={28} strokeWidth={1.3} />}
          </div>
          {profile?.hasGeneratedPortrait && <span className="portrait-badge" title="Retrato gerado pela IA"><Check size={12} /></span>}
        </div>
        <div>
          <span className="eyebrow">Arquivo do investigador</span>
          <h1>{profile?.displayName || name}</h1>
          <p>{profile?.bio || 'Ainda sem descrição.'}</p>
        </div>
        <button className="btn-secondary profile-edit-trigger" onClick={() => editing ? setEditing(false) : startEditing()}>
          <Edit3 size={15} /> {editing ? 'Fechar edição' : 'Editar perfil'}
        </button>
      </div>

      {status && <div className="profile-status" role="status">{status}</div>}

      {editing && (
        <form className="profile-form" onSubmit={save}>
          <div className="profile-form-photo">
            <label className="photo-picker">
              <Camera size={18} /> Escolher foto
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
            </label>
            <small>A IA preservará suas características e aplicará a direção cinematográfica do jogo.</small>
          </div>
          <label>
            Nome de investigador
            <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} maxLength={32} required />
          </label>
          <label>
            Bio curta
            <textarea className="input-field" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} rows={3} placeholder="Como você investiga?" />
          </label>
          <label className="profile-toggle">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Perfil ativo para a equipe
          </label>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Processando...' : 'Salvar perfil'}
          </button>
        </form>
      )}

      <div className="profile-stats">
        <div>
          <span>Investigações</span>
          <strong>0</strong>
          <small>concluídas</small>
        </div>
        <div>
          <span>Precisão</span>
          <strong>—</strong>
          <small>das teorias</small>
        </div>
      </div>

      <section className="profile-section" style={{ marginTop: 32 }}>
        <span className="eyebrow">Conta e sincronia</span>
        {authToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--olive-light)', fontSize: 13 }}>
              <Mail size={16} /> {authEmail || 'Conta vinculada'}
            </div>
            <button className="btn-secondary" onClick={handleLogout} style={{ alignSelf: 'flex-start', minHeight: 40, fontSize: 12 }}>
              <LogOut size={14} /> Sair da conta
            </button>
          </div>
        ) : profile?.hasProfile ? (
          <form onSubmit={handleInlineLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
              Você já possui um perfil cadastrado. Faça login com email e senha para sincronizar seus dados.
            </p>
            <input
              type="email" placeholder="Email" value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
            />
            <input
              type="password" placeholder="Senha" value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required minLength={6}
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
            />
            {loginError && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{loginError}</p>}
            <button className="btn-primary" type="submit" disabled={loginLoading} style={{ alignSelf: 'flex-start', minHeight: 40, fontSize: 12 }}>
              {loginLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
              Vincule seu perfil a um email para acessá-lo de qualquer dispositivo.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/login')} style={{ minHeight: 40, fontSize: 12 }}>
                Entrar
              </button>
              <button className="btn-secondary" onClick={() => navigate('/register')} style={{ minHeight: 40, fontSize: 12 }}>
                Criar conta
              </button>
              {userId && !authToken && (
                <button className="btn-secondary" onClick={handleLink} disabled={saving} style={{ minHeight: 40, fontSize: 12 }}>
                  <Mail size={14} /> Vincular este perfil
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="profile-section" style={{ marginTop: 32 }}>
        <span className="eyebrow">Marcas de campo</span>
        <h2>Conquistas</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '24px 0' }}>Nenhuma conquista desbloqueada ainda. Complete investigações para ganhar marcas de campo.</p>
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
              <Download size={16} /> Baixar
            </button>
            <button onClick={() => setPhotoViewer(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: 10, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
          <img src={profile.photo} alt={`Retrato de ${profile.displayName}`} style={{ maxWidth: '90%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default Profile;
