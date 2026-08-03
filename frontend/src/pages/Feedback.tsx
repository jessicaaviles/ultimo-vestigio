import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, FileText, FolderOpen, HelpCircle, Share2, Trophy } from 'lucide-react';
import { getRoomFeedbackSummary, submitFeedback } from '../services/api';

interface VoteSummary {
  playerId: string;
  userId: string;
  name: string;
  avatar?: string | null;
  votedFor: string;
}

interface RoomFeedbackSummary {
  playerCount: number;
  votes: VoteSummary[];
  result?: {
    score: number;
    questionCount: number;
    hintsUsed: number;
    attempts: number;
  } | null;
}

const Feedback: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [fair, setFair] = useState(true);
  const [playAnother, setPlayAnother] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<RoomFeedbackSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const displayName = localStorage.getItem('userName') || 'Investigadora_27';
  const currentUserId = localStorage.getItem('userId') || '';
  const progress = summary?.result?.score || 0;
  const questionCount = summary?.result?.questionCount || 0;
  const hintsUsed = summary?.result?.hintsUsed || 0;
  const attempts = summary?.result?.attempts || 0;

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    setSummaryLoading(true);
    getRoomFeedbackSummary(roomId)
      .then((response) => {
        if (!active) return;
        if (response.success) setSummary(response.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [roomId]);

  const rewardXp = useMemo(() => {
    const score = summary?.result?.score;
    if (typeof score === 'number') return Math.max(50, Math.round(score * 2.5));
    if (!rating) return 0;
    return 200 + rating * 25;
  }, [rating, summary?.result?.score]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roomId || !rating) return setError('Escolha uma nota para continuar.');
    setLoading(true);
    setError('');
    const response = await submitFeedback({
      roomId,
      userId: localStorage.getItem('userId') || '',
      rating,
      fairSolution: fair,
      masterError: false,
      confusion: false,
      playAnother,
      recommendationScore: rating,
    });
    if (response.success) setSent(true);
    else setError(response.error || 'Não foi possível registrar o feedback.');
    setLoading(false);
  };

  const shareProgress = async () => {
    const text = `Concluí um capítulo em Último Vestígio com ${progress}% de precisão na investigação.`;
    if (navigator.share) {
      await navigator.share({ title: 'Último Vestígio', text }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="chapter-complete-page">
      <div className="chapter-complete-bg" aria-hidden="true" />

      <section className="chapter-complete-hero">
        <span className="eyebrow">Fim do capítulo</span>
        <div className="chapter-complete-badge"><FolderOpen size={18} /> Capítulo 01</div>
        <h1>Capítulo concluído</h1>
        <div className="chapter-complete-rule" aria-hidden="true"><span /></div>
        <strong>Ótimo trabalho, investigador.</strong>
        <p>Você e sua equipe avançaram na investigação.</p>
      </section>

      <section className="chapter-card chapter-progress-card">
        <div>
          <span className="chapter-card-label">Precisão da investigação</span>
          <div className="chapter-progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>
            <span>{progress}%</span>
          </div>
        </div>
        <div className="chapter-progress-stats">
          <span><HelpCircle size={19} /> <strong>{questionCount}</strong> perguntas feitas</span>
          <span><FolderOpen size={19} /> <strong>{hintsUsed}</strong> pistas usadas</span>
          <span><FileText size={19} /> <strong>{attempts}</strong> tentativas finais</span>
        </div>
        <div className="chapter-next">
          <span className="chapter-card-label">Próxima investigação</span>
          <div className="chapter-next-image" />
          <small>Arquivo aberto</small>
          <strong>Escolha outro caso</strong>
          <em>No arquivo municipal</em>
        </div>
      </section>

      <section className="chapter-card chapter-rewards">
        <span className="chapter-card-label">Recompensas</span>
        <div className="chapter-reward-grid">
          <div><strong>+{rewardXp}</strong><span>XP experiência</span></div>
          <div><strong>+1</strong><span>ponto de dedução</span></div>
          <div><Trophy size={32} /><span>caso concluído</span></div>
        </div>
      </section>

      <section className="chapter-card chapter-votes">
        <div className="chapter-card-heading">
          <span className="chapter-card-label">Votação da equipe</span>
          <small>{summaryLoading ? 'carregando' : `${summary?.votes.length || 0}/${summary?.playerCount || 0} jogadores`}</small>
        </div>
        {summary?.votes.length ? summary.votes.map((player) => (
          <div className="chapter-vote-row" key={player.playerId}>
            {player.avatar ? <img src={player.avatar} alt="" /> : <div className="chapter-vote-avatar-fallback" aria-hidden="true">{player.name.slice(0, 1).toUpperCase()}</div>}
            <div>
              <strong>{player.userId === currentUserId ? displayName : player.name} {player.userId === currentUserId && <mark>Você</mark>}</strong>
              <span>Votou em: {player.votedFor}</span>
            </div>
            <CheckCircle2 size={22} />
          </div>
        )) : (
          <p className="chapter-votes-empty">
            {summaryLoading ? 'Buscando votos da equipe...' : 'Nenhum voto real foi encontrado para esta sala.'}
          </p>
        )}
        <button className="chapter-link-button" onClick={() => navigate(`/room/${roomId}/game`)}>
          Ver resultado da votação <ChevronRight size={17} />
        </button>
      </section>

      <section className="chapter-card chapter-feedback-card">
        {sent ? (
          <div className="chapter-feedback-sent">
            <Trophy size={34} />
            <span className="chapter-card-label">Registro concluído</span>
            <h2>Obrigado por investigar.</h2>
            <p>Seu feedback ajuda a calibrar os próximos casos.</p>
          </div>
        ) : (
          <form onSubmit={send}>
            <span className="chapter-card-label">Relatório rápido</span>
            <h2>Como foi a experiência?</h2>
            <div className="chapter-rating" aria-label="Sua nota geral">
              {[1, 2, 3, 4, 5].map((value) => (
                <button type="button" key={value} onClick={() => setRating(value)} className={rating >= value ? 'is-active' : ''}>
                  ★
                </button>
              ))}
            </div>
            <label><input type="checkbox" checked={fair} onChange={(e) => setFair(e.target.checked)} /> A solução me pareceu justa</label>
            <label><input type="checkbox" checked={playAnother} onChange={(e) => setPlayAnother(e.target.checked)} /> Eu jogaria outro caso</label>
            {error && <p className="chapter-feedback-error">{error}</p>}
            <button type="submit" className="chapter-primary-action" disabled={loading || rating === 0}>
              {loading ? 'Enviando...' : 'Enviar relatório'}
            </button>
          </form>
        )}
      </section>

      <div className="chapter-actions">
        <button className="chapter-secondary-action" onClick={shareProgress}>
          <Share2 size={17} /> Compartilhar progresso
        </button>
        <button className="chapter-primary-action" onClick={() => navigate('/cases')}>
          Continuar investigando
        </button>
      </div>
    </div>
  );
};

export default Feedback;
