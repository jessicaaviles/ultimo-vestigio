import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Award,
  Check,
  Copy,
  MailPlus,
  Medal,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
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

type Invite = {
  id: string;
  name: string;
  handle: string;
  note: string;
};

const STORAGE_KEY = 'uv_friends';
const INVITES_KEY = 'uv_friend_invites';

const initialFriends: Friend[] = [
  {
    id: 'friend-helena',
    name: 'Helena Duarte',
    handle: '@helenad',
    email: 'helena.duarte@arquivo.local',
    status: 'investigando',
    level: 12,
    xp: 3840,
    accuracy: 78,
    casesSolved: 9,
    achievements: ['Primeiro caso', 'Dedução correta', 'Trabalho em equipe'],
    avatar: '/backgrounds/helena_portrait.png',
  },
  {
    id: 'friend-tomas',
    name: 'Tomás Ribeiro',
    handle: '@tomasr',
    email: 'tomas.ribeiro@arquivo.local',
    status: 'online',
    level: 8,
    xp: 2140,
    accuracy: 64,
    casesSolved: 5,
    achievements: ['Primeiro caso', 'Investigador consistente'],
    avatar: '/backgrounds/tomas_portrait.png',
  },
  {
    id: 'friend-livia',
    name: 'Lívia Moraes',
    handle: '@liviam',
    email: 'livia.moraes@arquivo.local',
    status: 'ausente',
    level: 15,
    xp: 4520,
    accuracy: 86,
    casesSolved: 13,
    achievements: ['Primeiro caso', 'Precisão de elite', 'Colecionador de pistas'],
    avatar: '/backgrounds/clara_portrait.png',
  },
];

const initialInvites: Invite[] = [
  {
    id: 'invite-ana',
    name: 'Ana Vilar',
    handle: '@anav',
    note: 'Quer participar da próxima investigação com você.',
  },
  {
    id: 'invite-caio',
    name: 'Caio Nogueira',
    handle: '@caion',
    note: 'Enviou um convite depois do caso Quarto 7.',
  },
];

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `friend-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  const [friends, setFriends] = useState<Friend[]>(() => readStored(STORAGE_KEY, initialFriends));
  const [invites, setInvites] = useState<Invite[]>(() => readStored(INVITES_KEY, initialInvites));
  const [query, setQuery] = useState('');
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [status, setStatus] = useState('');

  const inviteCode = useMemo(() => {
    const raw = `${user?.userId || localStorage.getItem('userId') || 'UV'}-${user?.displayName || 'investigador'}`;
    return btoa(unescape(encodeURIComponent(raw))).replace(/=+$/g, '').slice(0, 10).toUpperCase();
  }, [user?.displayName, user?.userId]);

  const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;

  const persistFriends = (next: Friend[]) => {
    setFriends(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const persistInvites = (next: Invite[]) => {
    setInvites(next);
    localStorage.setItem(INVITES_KEY, JSON.stringify(next));
  };

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
    const exists = friends.some((friend) => friend.email.toLowerCase() === value.toLowerCase() || friend.handle.toLowerCase() === value.toLowerCase());
    if (exists) {
      setStatus('Esse investigador já está na sua rede.');
      return;
    }

    const name = value.includes('@') ? value.split('@')[0].replace(/[._-]+/g, ' ') : value.replace(/^@/, '');
    const normalizedName = name.replace(/\b\w/g, (letter) => letter.toUpperCase());
    const nextFriend: Friend = {
      id: createId(),
      name: normalizedName || 'Novo investigador',
      handle: value.startsWith('@') ? value : `@${normalizedName.toLowerCase().replace(/\s+/g, '') || 'investigador'}`,
      email: value.includes('@') ? value : `${normalizedName.toLowerCase().replace(/\s+/g, '.')}@convite.local`,
      status: 'online',
      level: 1,
      xp: 0,
      accuracy: 0,
      casesSolved: 0,
      achievements: ['Convite aceito'],
      avatar: '',
    };

    persistFriends([nextFriend, ...friends]);
    setNameOrEmail('');
    setStatus('Amigo adicionado à sua rede.');
  };

  const handleCopyInvite = async () => {
    await navigator.clipboard?.writeText(inviteLink).catch(() => {});
    setStatus('Link de convite copiado.');
  };

  const handleRemoveFriend = (id: string) => {
    persistFriends(friends.filter((friend) => friend.id !== id));
    setStatus('Amigo removido da sua rede.');
  };

  const handleAcceptInvite = (invite: Invite) => {
    const nextFriend: Friend = {
      id: invite.id.replace('invite', 'friend'),
      name: invite.name,
      handle: invite.handle,
      email: `${invite.handle.replace('@', '')}@arquivo.local`,
      status: 'online',
      level: 3,
      xp: 720,
      accuracy: 50,
      casesSolved: 2,
      achievements: ['Primeiro caso'],
      avatar: '',
    };
    persistFriends([nextFriend, ...friends]);
    persistInvites(invites.filter((item) => item.id !== invite.id));
    setStatus('Convite aceito.');
  };

  const handleDeclineInvite = (id: string) => {
    persistInvites(invites.filter((item) => item.id !== id));
    setStatus('Convite recusado.');
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

      {invites.length > 0 && (
        <section className="friends-section">
          <div className="friends-section-heading">
            <div>
              <span className="eyebrow">Solicitações</span>
              <h2>Convites pendentes</h2>
            </div>
            <span>{invites.length} novo{invites.length > 1 ? 's' : ''}</span>
          </div>
          <div className="friends-invite-list">
            {invites.map((invite) => (
              <article className="friends-request-card" key={invite.id}>
                <div className="friends-avatar friends-avatar--initials">{getInitials(invite.name)}</div>
                <div>
                  <h3>{invite.name}</h3>
                  <span>{invite.handle}</span>
                  <p>{invite.note}</p>
                </div>
                <div className="friends-request-actions">
                  <button aria-label={`Aceitar convite de ${invite.name}`} onClick={() => handleAcceptInvite(invite)}>
                    <Check size={17} />
                  </button>
                  <button aria-label={`Recusar convite de ${invite.name}`} onClick={() => handleDeclineInvite(invite.id)}>
                    <X size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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

              <div className="friend-achievements">
                <span><Medal size={14} /> Conquistas</span>
                <div>
                  {friend.achievements.map((achievement) => (
                    <span key={achievement}>
                      {achievement === 'Precisão de elite' ? <Star size={12} /> : achievement === 'Trabalho em equipe' ? <Users size={12} /> : <Award size={12} />}
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>

              <div className="friend-actions">
                <button className="btn-secondary" onClick={() => setStatus(`Mensagem para ${friend.name} preparada para a próxima versão do chat.`)}>
                  <MessageCircle size={15} /> Mensagem
                </button>
                <button className="friend-remove" onClick={() => handleRemoveFriend(friend.id)} aria-label={`Excluir ${friend.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
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
