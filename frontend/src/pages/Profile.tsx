import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Download, Edit3, LogOut, Mail, Upload, UserPlus, X } from 'lucide-react';
import { getProfile, updateProfile, authValidate, authLogout } from '../services/api';
import Loading from '../components/Loading';

interface ProfileData {
  id: string;
  displayName: string;
  bio: string;
  active: boolean;
  photo: string | null;
  hasGeneratedPortrait: boolean;
  hasProfile: boolean;
  portraitGenerations?: number;
  portraitGenerationsRemaining?: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
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
  const [generatingPortrait, setGeneratingPortrait] = useState(false);

  const fetchSeqRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            setProfile(profileRes.data);
            setName(profileRes.data.displayName);
            setBio(profileRes.data.bio);
            setActive(profileRes.data.active);
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
    setAuthToken(null);
    setProfile(null);
    setStatus('Você saiu da sua conta.');
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

  const save = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!profile?.id || !authToken) return;
    const hasPhoto = Boolean(photoData || preview && !profile.photo);
    setSaving(true);
    setStatus(hasPhoto ? 'Gerando retrato investigador…' : 'Salvando perfil…');
    if (hasPhoto) setGeneratingPortrait(true);
    try {
      const response = await updateProfile(profile.id, {
        displayName: name, bio, active,
        photoData: photoData || undefined,
        generatePortrait: Boolean(photoData),
      });
      if (!response.success) throw new Error(response.error);
      setProfile(response.data);
      setName(response.data.displayName);
      setBio(response.data.bio);
      setActive(response.data.active);
      setPhotoData('');
      setPreview('');
      setEditing(false);
      const genStatus = (response as any).portraitStatus;
      if (hasPhoto && genStatus === 'READY') setStatus('Perfil salvo! Retrato gerado com sucesso.');
      else if (hasPhoto && genStatus === 'UNAVAILABLE') setStatus('Perfil salvo, mas o retrato não pôde ser gerado no momento.');
      else setStatus('Perfil salvo com sucesso!');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
      setGeneratingPortrait(false);
    }
  };

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024)
      return setStatus('Use uma imagem JPG, PNG ou WEBP de até 4 MB.');
    if ((profile?.portraitGenerationsRemaining ?? 3) <= 0)
      return setStatus('Limite de retratos atingido (máximo 3).');
    const reader = new FileReader();
    reader.onload = async () => {
      const value = String(reader.result);
      setPhotoData(value);
      setPreview(value);
      setStatus('Gerando retrato investigador…');
      setGeneratingPortrait(true);
      if (profile?.id && authToken) {
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
          const genStatus = (response as any).portraitStatus;
          if (genStatus === 'READY') setStatus('Retrato gerado com sucesso!');
          else if (genStatus === 'UNAVAILABLE') setStatus('Não foi possível gerar o retrato no momento.');
          else setStatus('Perfil salvo com sucesso!');
        } catch (error) {
          setStatus(error instanceof Error ? error.message : 'Erro ao gerar retrato.');
        } finally {
          setGeneratingPortrait(false);
        }
      }
    };
    reader.readAsDataURL(file);
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

  if (!authToken) {
    return (
      <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="profile-hero" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <Camera size={32} strokeWidth={1.3} />
            </div>
          </div>
          <h1 style={{ margin: 0 }}>Último Vestígio</h1>
          <p style={{ color: '#94A3B8', maxWidth: 400 }}>
            Crie sua conta para participar das investigações e salvar seu progresso como investigador.
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
          <div className={`profile-avatar${generatingPortrait ? ' profile-avatar--generating' : ''}`} style={{ cursor: image ? 'pointer' : 'default' }} onClick={() => image && setPhotoViewer(true)}>
            {image ? <img src={image} alt={`Retrato de ${name}`} /> : <Camera size={28} strokeWidth={1.3} />}
            {generatingPortrait && <div className="profile-avatar-spinner" />}
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
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} required style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '5px 0', padding: 0, border: 'none', borderBottom: '1px solid var(--gold)', background: 'transparent', color: '#F8F9FA', width: '100%', outline: 'none', lineHeight: 1.2, boxSizing: 'border-box' }} />
          ) : (
            <h1>{profile?.displayName || name}</h1>
          )}
          {editing ? (
            <textarea className="input-field" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={1} placeholder="Como você investiga?" style={{ color: 'var(--muted)', maxWidth: 440, fontSize: 14, padding: 0, border: 'none', borderBottom: '1px solid var(--gold)', background: 'transparent', resize: 'vertical', width: '100%', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          ) : (
            <p style={{ margin: 0 }}>{profile?.bio || 'Ainda sem descrição.'}</p>
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
          <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setName(profile?.displayName || 'Investigador'); setBio(profile?.bio || ''); setPhotoData(''); setPreview(''); }} disabled={saving}>
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
        <span className="eyebrow">Conta</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
          {authEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--olive-light)', fontSize: 13 }}>
              <Mail size={16} /> {authEmail}
            </div>
          )}
          <button className="btn-secondary" onClick={handleLogout} style={{ alignSelf: 'flex-start', minHeight: 40, fontSize: 12 }}>
            <LogOut size={14} /> Sair da conta
          </button>
        </div>
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
              <Download size={16} /> Salvar imagem
            </button>
            <button onClick={() => setPhotoViewer(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: 10, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ maxWidth: '90%', maxHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={profile.photo} alt={`Retrato de ${profile.displayName}`} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPhotoViewer(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button onClick={() => { setPhotoViewer(false); fileInputRef.current?.click(); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Upload size={16} /> Alterar imagem
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;