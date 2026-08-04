import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Copy,
  MailPlus,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Check,
  X,
  UserPlus,
  Users,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  acceptFriendInvitation,
  addFriend,
  declineFriendInvitation,
  listFriendInvitations,
  listFriends,
  removeFriend
} from '../services/api';

type Friend = {
  id: string;
  name: string;
  handle: string;
  email: string;
  status: 'active' | 'ausente';
  achievements: string[];
  avatar: string;
  stats?: {
    casesSolved: number;
    correctTheories: number;
  };
  direction?: 'incoming' | 'outgoing';
  friendshipStatus?: 'PENDING' | 'ACCEPTED';
  pending?: boolean;
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
  active: 'Ativo',
  ausente: 'Ausente',
};

const Friends: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<Friend[]>([]);
  const [query, setQuery] = useState('');
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = user?.userId || localStorage.getItem('userId') || '';

  const inviteCode = useMemo(() => {
    const raw = `${userId || 'UV'}-${user?.displayName || 'investigador'}`;
    return btoa(unescape(encodeURIComponent(raw))).replace(/=+$/g, '').slice(0, 10).toUpperCase();
  }, [user?.displayName, userId]);

  const inviteLink = userId
    ? `${window.location.origin}/register?friend=${encodeURIComponent(userId)}`
    : `${window.location.origin}/register`;

  const loadNetwork = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [friendsResponse, invitationsResponse] = await Promise.all([listFriends(userId), listFriendInvitations(userId)]);
      if (friendsResponse.success) setFriends(friendsResponse.data?.friends || []);
      else setStatus(friendsResponse.error || 'Não foi possível carregar sua rede.');
      if (invitationsResponse.success) setInvitations(invitationsResponse.data?.invitations || []);
    } catch {
      setStatus('Não foi possível carregar sua rede.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadNetwork();
  }, [loadNetwork]);

  const filteredFriends = friends.filter((friend) => {
    const haystack = `${friend.name} ${friend.handle} ${friend.email}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  });

  const filteredInvitations = invitations.filter((friend) => {
    const haystack = `${friend.name} ${friend.handle} ${friend.email}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  });

  const totalAchievements = friends.reduce((total, friend) => total + friend.achievements.length, 0);
  const activeFriends = friends.filter((friend) => friend.status !== 'ausente').length;
  const pendingInvitations = invitations.length;

  const handleAddFriend = (event: FormEvent) => {
    event.preventDefault();
    const value = nameOrEmail.trim();
    if (!value) return;
    if (!userId) {
      setStatus('Crie ou acesse sua conta para adicionar amigos.');
      return;
    }

    setLoading(true);
    addFriend(userId, value)
      .then(async (response) => {
        if (response.success) {
          if (response.data?.friend) {
            setFriends((current) => {
              const nextFriend = response.data.friend;
              const withoutDuplicate = current.filter((friend) => friend.id !== nextFriend.id);
              return [nextFriend, ...withoutDuplicate];
            });
            setStatus('Amigo adicionado à sua rede.');
          } else if (response.data?.invitation) {
            setInvitations((current) => {
              const nextInvite = response.data.invitation;
              const withoutDuplicate = current.filter((friend) => friend.id !== nextInvite.id);
              return [nextInvite, ...withoutDuplicate];
            });
            setStatus('Convite enviado. A pessoa aparecerá como amiga quando aceitar.');
          }
          setNameOrEmail('');
          await loadNetwork();
          return;
        }
        await navigator.clipboard?.writeText(`${inviteLink}&to=${encodeURIComponent(value)}`).catch(() => {});
        setStatus(response.error || 'Jogador não encontrado. Link de convite copiado.');
      })
      .catch(() => setStatus('Não foi possível adicionar agora. Tente novamente.'))
      .finally(() => setLoading(false));
  };

  const handleCopyInvite = async () => {
    await navigator.clipboard?.writeText(inviteLink).catch(() => {});
    setStatus('Link de convite copiado.');
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!userId) return;
    setLoading(true);
    const response = await removeFriend(userId, friendshipId).catch(() => ({ success: false, error: 'Não foi possível remover.' }));
    if (response.success) {
      setFriends((current) => current.filter((friend) => friend.id !== friendshipId));
      setInvitations((current) => current.filter((friend) => friend.id !== friendshipId));
      setStatus('Amigo removido da sua rede.');
      await loadNetwork();
    } else {
      setStatus(response.error || 'Não foi possível remover.');
    }
    setLoading(false);
  };

  const handleAcceptInvitation = async (friendshipId: string) => {
    if (!userId) return;
    setLoading(true);
    const response = await acceptFriendInvitation(userId, friendshipId).catch(() => ({ success: false, error: 'Não foi possível aceitar.' }));
    if (response.success) {
      setInvitations((current) => current.filter((friend) => friend.id !== friendshipId));
      if (response.data?.friend) {
        setFriends((current) => {
          const nextFriend = response.data.friend;
          const withoutDuplicate = current.filter((friend) => friend.id !== nextFriend.id);
          return [nextFriend, ...withoutDuplicate];
        });
      }
      setStatus('Convite aceito.');
      await loadNetwork();
    } else {
      setStatus(response.error || 'Não foi possível aceitar.');
    }
    setLoading(false);
  };

  const handleDeclineInvitation = async (friendshipId: string) => {
    if (!userId) return;
    setLoading(true);
    const response = await declineFriendInvitation(userId, friendshipId).catch(() => ({ success: false, error: 'Não foi possível recusar.' }));
    if (response.success) {
      setInvitations((current) => current.filter((friend) => friend.id !== friendshipId));
      setStatus('Convite recusado.');
      await loadNetwork();
    } else {
      setStatus(response.error || 'Não foi possível recusar.');
    }
    setLoading(false);
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
          <strong>{pendingInvitations}</strong>
          <span>convites pendentes</span>
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
              <UserPlus size={16} /> {loading ? 'Aguarde' : 'Adicionar'}
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
          {loading && filteredFriends.length === 0 && (
            <div className="friends-empty">
              <MailPlus size={30} />
              <h3>Carregando rede</h3>
              <p>Estamos buscando seus amigos e estatísticas reais.</p>
            </div>
          )}
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
                    <strong>{friend.stats?.correctTheories ?? 0}</strong>
                    <span>deduções</span>
                  </div>
                  <div>
                    <strong>{friend.stats?.casesSolved ?? 0}</strong>
                    <span>casos</span>
                  </div>
                <div>
                  <strong>{friend.achievements.length}</strong>
                  <span>conquistas</span>
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
              <div className="friend-actions">
                <button className="friend-remove" onClick={() => handleRemoveFriend(friend.id)} aria-label={`Excluir ${friend.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {!loading && filteredFriends.length === 0 && (
          <div className="friends-empty">
            <MailPlus size={30} />
            <h3>Nenhum investigador encontrado</h3>
            <p>Use o convite rápido ou adicione alguém por nome, usuário ou e-mail.</p>
          </div>
        )}

        <div className="friends-invite-list">
          {filteredInvitations.length > 0 && (
            <div className="friends-section-heading" style={{ marginTop: '26px' }}>
              <div>
                <span className="eyebrow">Convites</span>
                <h2>Recebidos e enviados</h2>
              </div>
            </div>
          )}
          {filteredInvitations.map((invite) => (
            <article className="friends-request-card" key={invite.id}>
              {invite.avatar ? (
                <img className="friends-avatar" src={invite.avatar} alt="" />
              ) : (
                <div className="friends-avatar friends-avatar--initials">{getInitials(invite.name)}</div>
              )}
              <div>
                <div className="friend-name-row">
                  <h3>{invite.name}</h3>
                  <span className={`friend-status friend-status--investigando`}>
                    {invite.direction === 'incoming' ? 'Recebido' : 'Enviado'}
                  </span>
                </div>
                <span>{invite.handle}</span>
                <p>
                  {invite.direction === 'incoming'
                    ? 'Esse investigador quer entrar na sua rede.'
                    : 'Seu convite ainda está aguardando resposta.'}
                </p>
              </div>
              <div className="friends-request-actions">
                {invite.direction === 'incoming' ? (
                  <>
                    <button type="button" onClick={() => handleAcceptInvitation(invite.id)} aria-label={`Aceitar ${invite.name}`}>
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => handleDeclineInvitation(invite.id)} aria-label={`Recusar ${invite.name}`}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => handleDeclineInvitation(invite.id)} aria-label={`Cancelar convite para ${invite.name}`}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Friends;
