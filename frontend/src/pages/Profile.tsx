import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Camera, Check, Edit3, UserPlus } from 'lucide-react';
import { getProfile, updateProfile, registerAnonymousUser } from '../services/api';
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
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
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

  const savingRef = useRef(false);
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    if (!userId) {
      registerAnonymousUser().then((res) => {
        if (res.success) {
          localStorage.setItem('deviceToken', res.data.deviceToken);
          localStorage.setItem('userId', res.data.userId);
          setUserId(res.data.userId);
        }
      }).catch(() => setStatus('Não foi possível registrar seu perfil temporário.'));
      return;
    }
    if (savingRef.current) return;
    setLoading(true);
    const seq = ++fetchSeqRef.current;
    getProfile(userId).then((response) => {
      if (seq !== fetchSeqRef.current) return;
      if (response.success) {
        setProfile(response.data);
        setName(response.data.displayName);
        setBio(response.data.bio);
        setActive(response.data.active);
      } else {
        setProfile({ id: userId, displayName: 'Investigador', bio: '', active: true, photo: null, hasGeneratedPortrait: false, hasProfile: false });
      }
      setLoading(false);
    }).catch(() => {
      if (seq !== fetchSeqRef.current) return;
      setStatus('Não foi possível carregar o perfil.');
      setProfile({ id: userId, displayName: 'Investigador', bio: '', active: true, photo: null, hasGeneratedPortrait: false, hasProfile: false });
      setLoading(false);
    });
  }, [userId]);

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
        displayName: name,
        bio,
        active,
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
          <div className="profile-avatar">
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

      <section className="profile-section">
        <span className="eyebrow">Marcas de campo</span>
        <h2>Conquistas</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '24px 0' }}>Nenhuma conquista desbloqueada ainda. Complete investigações para ganhar marcas de campo.</p>
      </section>
    </div>
  );
};

export default Profile;
