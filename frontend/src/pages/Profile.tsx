import React, { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Award, Camera, Check, Edit3, Shield, Trophy } from 'lucide-react';
import { getProfile, updateProfile, registerAnonymousUser } from '../services/api';

interface ProfileData { id: string; displayName: string; bio: string; active: boolean; photo: string | null; hasGeneratedPortrait: boolean; }

const Profile: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('Investigador'); const [bio, setBio] = useState(''); const [active, setActive] = useState(true);
  const [photoData, setPhotoData] = useState(''); const [preview, setPreview] = useState(''); const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false); const [status, setStatus] = useState('');

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
    getProfile(userId).then((response) => {
      if (response.success) {
        setProfile(response.data);
        setName(response.data.displayName);
        setBio(response.data.bio);
        setActive(response.data.active);
      }
    }).catch(() => setStatus('Não foi possível carregar o perfil.'));
  }, [userId]);
  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) return setStatus('Use uma imagem JPG, PNG ou WEBP de até 4 MB.'); const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); setPhotoData(value); setPreview(value); setStatus(''); }; reader.readAsDataURL(file); };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!userId) return; setSaving(true); setStatus('Gerando retrato cinematográfico...'); try { const response = await updateProfile(userId, { displayName: name, bio, active, photoData: photoData || undefined, generatePortrait: Boolean(photoData) }); if (!response.success) throw new Error(response.error); setProfile(response.data); setName(response.data.displayName); setBio(response.data.bio); setActive(response.data.active); setPhotoData(''); setPreview(''); setEditing(false); setStatus(response.portraitStatus === 'UNAVAILABLE' ? `Perfil salvo, mas a IA não gerou o retrato agora.${response.portraitError ? ` Motivo: ${response.portraitError}` : ''}` : response.data.hasGeneratedPortrait ? 'Perfil e retrato atualizados.' : 'Perfil atualizado.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.'); } finally { setSaving(false); } };
  const image = preview || profile?.photo;
  return <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    <div className="profile-hero"><div className="profile-avatar-wrap"><div className="profile-avatar">{image ? <img src={image} alt={`Retrato de ${name}`} /> : <Camera size={28} strokeWidth={1.3} />}</div>{profile?.hasGeneratedPortrait && <span className="portrait-badge" title="Retrato gerado pela IA"><Check size={12} /></span>}</div><div><span className="eyebrow">Arquivo do investigador</span><h1>{profile?.displayName || name}</h1><p>{profile?.bio || 'Ainda sem descrição.'}</p></div><button className="btn-secondary profile-edit-trigger" onClick={() => setEditing((value) => !value)}><Edit3 size={15} /> {editing ? 'Fechar edição' : 'Editar perfil'}</button></div>
    {status && <div className="profile-status" role="status">{status}</div>}
    {editing && <form className="profile-form" onSubmit={save}><div className="profile-form-photo"><label className="photo-picker"><Camera size={18} /> Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></label><small>A IA preservará suas características e aplicará a direção cinematográfica do jogo.</small></div><label>Nome de investigador<input className="input-field" value={name} onChange={(event) => setName(event.target.value)} maxLength={32} required /></label><label>Bio curta<textarea className="input-field" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} rows={3} placeholder="Como você investiga?" /></label><label className="profile-toggle"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Perfil ativo para a equipe</label><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Processando...' : 'Salvar perfil'}</button></form>}
    <div className="profile-stats"><div><span>Investigações</span><strong>02</strong><small>concluídas</small></div><div><span>Precisão</span><strong>90%</strong><small>das teorias</small></div></div>
    <section className="profile-section"><span className="eyebrow">Marcas de campo</span><h2>Conquistas</h2><div className="profile-achievements"><div><Award size={20} /><span><strong>Lente Analítica</strong><small>Primeiro caso difícil desbloqueado</small></span></div><div><Trophy size={20} /><span><strong>Dedução Pura</strong><small>Teoria com precisão total</small></span></div><div><Shield size={20} /><span><strong>Trabalho de Campo</strong><small>Investigações em equipe</small></span></div></div></section>
  </div>;
};
export default Profile;
