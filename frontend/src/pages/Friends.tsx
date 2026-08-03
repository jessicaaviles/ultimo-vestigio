import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Copy,
  MailPlus,
  Search,
  Shield,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Friend = {
  id: string;
  name: string;
  handle: string;
  email: string;
  status: 'online' | 'investigando' | 'ausente';
  level: number;
  xp: number;
  accuracy: number;
  casesSolved: number;
  achievements: string[];
  avatar: string;
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const statusLabels: Record<Friend['status'], string> = {
  online: 'Online',
  investigando: 'Investigando',
  ausente: 'Ausente',
};

const Friends: React.FC = () => {
  const { user } = useAuth();
  const friends: Friend[] = [];
  const [query, setQuery] = useState('');
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [status, setStatus] = useState('');

  const inviteCode = useMemo(() => {
    const raw = `${user?.userId || localStorage.getItem('userId') || 'UV'}-${user?.displayName || 'investigador'}`;
    return btoa(unescape(encodeURIComponent(raw))).replace(/=+$/g, '').slice(0, 10).toUpperCase();
  }, [user?.displayName, user?.userId]);

  const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;

  const filteredFriends = friends.filter((friend) => {
    const haystack = `${friend.name} ${friend.handle} ${friend.email}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  });

  const totalAchievements = friends.reduce((total, friend) => total + friend.achievements.length, 0);
  const averageAccuracy = friends.length
    ? Math.round(friends.reduce((total, friend) => total + friend.accuracy, 0) / friends.length)
    : 0;
  const activeFriends = friends.filter((friend) => friend.status !== 'ausente').length;

  const handleAddFriend = (event: FormEvent) => {
    event.preventDefault();
    const value = nameOrEmail.trim();
    if (!value) return;
    navigator.clipboard?.writeText(`${inviteLink}&to=${encodeURIComponent(value)}`).catch(() => {});
    setNameOrEmail('');
    setStatus('Link de convite preparado. A rede de amigos será sincronizada quando o serviço estiver ativo.');
  };

  const handleCopyInvite = async () => {
    await navigator.clipboard?.writeText(inviteLink).catch(() => {});
    setStatus('Link de convite copiado.');
  };

  return (
    <div className="friends-page">
      <section className="friends-hero">
        <span className="eyebrow">Rede de investigadores</span>
        <h1>Amigos</h1>
        <p>Convide pessoas para investigar com você, acompanhe conquistas e mantenha sua equipe por perto.</p>
      </section>

      <section className="friends-summary" aria-label="Resumo da rede">
        <div>
          <Users size={20} />
          <strong>{friends.length}</strong>
          <span>amigos</span>
        </div>
        <div>
          <Sparkles size={20} />
          <strong>{activeFriends}</strong>
          <span>ativos agora</span>
        </div>
        <div>
          <Trophy size={20} />
          <strong>{totalAchievements}</strong>
          <span>conquistas</span>
        </div>
        <div>
          <Shield size={20} />
          <strong>{averageAccuracy}%</strong>
          <span>precisão média</span>
        </div>
      </section>

      <section className="friends-tools">
        <form className="friends-add-card" onSubmit={handleAddFriend}>
          <div>
            <span className="eyebrow">Adicionar amigo</span>
            <h2>Novo investigador</h2>
            <p>Digite um nome, @usuário ou e-mail para adicionar alguém à sua rede.</p>
          </div>
          <div className="friends-add-row">
            <input
              value={nameOrEmail}
              onChange={(event) => setNameOrEmail(event.target.value)}
              placeholder="nome, @usuario ou email"
              aria-label="Nome, usuário ou e-mail do amigo"
            />
            <button className="btn-primary" type="submit">
              <UserPlus size={16} /> Adicionar
            </button>
          </div>
        </form>

        <div className="friends-invite-card">
          <div>
            <span className="eyebrow">Convite rápido</span>
            <h2>Chamar equipe</h2>
            <p>Compartilhe seu link para que novos investigadores encontrem seu perfil.</p>
          </div>
          <button className="friends-invite-code" onClick={handleCopyInvite}>
            <span>{inviteCode}</span>
            <Copy size={16} />
          </button>
        </div>
      </section>

      {status && <div className="friends-status" role="status">{status}</div>}

      <section className="friends-section">
        <div className="friends-section-heading">
          <div>
            <span className="eyebrow">Sua rede</span>
            <h2>Investigadores</h2>
          </div>
          <label className="friends-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar amigo" />
          </label>
        </div>

        <div className="friends-grid">
          {filteredFriends.map((friend) => (
            <article className="friend-card" key={friend.id}>
              <div className="friend-card-top">
                {friend.avatar ? (
                  <img className="friends-avatar" src={friend.avatar} alt="" />
                ) : (
                  <div className="friends-avatar friends-avatar--initials">{getInitials(friend.name)}</div>
                )}
                <div>
                  <div className="friend-name-row">
                    <h3>{friend.name}</h3>
                    <span className={`friend-status friend-status--${friend.status}`}>{statusLabels[friend.status]}</span>
                  </div>
                  <span>{friend.handle}</span>
                </div>
              </div>

              <div className="friend-stats">
                <div>
                  <strong>LV.{friend.level}</strong>
                  <span>{friend.xp.toLocaleString('pt-BR')} XP</span>
                </div>
                <div>
                  <strong>{friend.casesSolved}</strong>
                  <span>casos</span>
                </div>
                <div>
                  <strong>{friend.accuracy}%</strong>
                  <span>precisão</span>
                </div>
              </div>

              {friend.achievements.length > 0 && (
                <div className="friend-achievements">
                  <span><Trophy size={14} /> Conquistas</span>
                  <div>
                    {friend.achievements.map((achievement) => (
                      <span key={achievement}>
                        <Trophy size={12} />
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {filteredFriends.length === 0 && (
          <div className="friends-empty">
            <MailPlus size={30} />
            <h3>Nenhum investigador encontrado</h3>
            <p>Use o convite rápido ou adicione alguém por nome, usuário ou e-mail.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Friends;
