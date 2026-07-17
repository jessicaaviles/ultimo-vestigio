import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/useSocket';
import Loading from '../components/Loading';

const Game: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [roomData, setRoomData] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [theoryAnswers, setTheoryAnswers] = useState<any>({ what_happened: '', who: '', how: '', why: '' });
  const [trueSolution, setTrueSolution] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [activeVote, setActiveVote] = useState<any>(null);
  const [hints, setHints] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [questionWarning, setQuestionWarning] = useState<{ kind: 'repeat' | 'reformulate'; text: string; answer?: string } | null>(null);
  const [evaluationNotice, setEvaluationNotice] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !roomId) return;
    
    const userId = localStorage.getItem('userId');
    socket.emit('join_room', { roomId, userId });

    socket.on('room_state_updated', (data) => {
      setRoomData(data);
    });

    socket.on('question_processed', (data) => {
      setLoading(false);
      setHistory(prev => [...prev, data]);
      setQuestion('');
    });

    socket.on('vote_started', (data) => setActiveVote(data));
    socket.on('vote_closed', () => setActiveVote(null));
    socket.on('hint_used', (data) => setHints(prev => [...prev, data]));
    socket.on('question_repeated', (data) => { setLoading(false); setQuestionWarning({ kind: 'repeat', text: `Uma pergunta parecida já foi feita: “${data.previous}”`, answer: data.answer }); });
    socket.on('question_needs_reformulation', (data) => { setLoading(false); setQuestionWarning({ kind: 'reformulate', text: data.message }); });
    socket.on('clarification_added', (data) => setHistory(prev => prev.map(item => item.question?.id === data.questionId ? { ...item, clarification: data.text } : item)));
    socket.on('contestation_resolved', (data) => setHistory(prev => prev.map(item => item.question?.id === data.questionId ? { ...item, contestation: data.text } : item)));

    socket.on('game_over', (data) => {
      setLoading(false);
      setGameResult(data);
      setTrueSolution(data.solution?.text || null);
    });
    socket.on('theory_evaluation', (data) => setEvaluationNotice(data));

    socket.on('room_error', (err) => {
      setLoading(false);
      setErrorMessage(String(err));
    });

    return () => {
      socket.off('room_state_updated');
      socket.off('question_processed');
      socket.off('vote_started');
      socket.off('vote_closed');
      socket.off('hint_used');
      socket.off('question_repeated');
      socket.off('question_needs_reformulation');
      socket.off('clarification_added');
      socket.off('contestation_resolved');
      socket.off('game_over');
      socket.off('theory_evaluation');
      socket.off('room_error');
    };
  }, [socket, roomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !isMyTurn) return;
    
    setLoading(true);
    socket?.emit('submit_question', {
      roomId,
      userId: localStorage.getItem('userId'),
      questionText: question,
      forceRepeat: false,
      idempotencyKey: `${roomId}:${localStorage.getItem('userId')}:${Date.now()}`
    });
  };

  const handlePassTurn = () => {
    socket?.emit('pass_turn', { roomId, userId: localStorage.getItem('userId') });
  };

  const handleStartSolving = () => {
    socket?.emit('start_solving', { roomId, userId: localStorage.getItem('userId') });
  };

  const handleVote = (optionId: string) => {
    if (!activeVote) return;
    socket?.emit('cast_vote', { roomId, voteId: activeVote.id, userId, optionId });
  };

  const handleHint = () => {
    const hintIndex = hints.length + 1;
    socket?.emit('use_hint', { roomId, userId, hintIndex, idempotencyKey: `${roomId}:${userId}:hint:${hintIndex}` });
  };

  const requestClarification = (questionId: string) => socket?.emit('request_clarification', { roomId, userId, questionId });
  const contestAnswer = (questionId: string) => socket?.emit('contest_answer', { roomId, userId, questionId, reason: 'possible_contradiction' });

  const handleSubmitTheory = (e: React.FormEvent) => {
    e.preventDefault();
    socket?.emit('submit_theory', {
      roomId,
      userId: localStorage.getItem('userId'),
      answers: theoryAnswers
    });
  };

  const handleFinishGame = () => {
    setLoading(true);
    socket?.emit('finish_game', { roomId, userId: localStorage.getItem('userId') });
  };

  const userId = localStorage.getItem('userId');
  const players = roomData?.players || [];
  const activeTurn = roomData?.turns?.find((t: any) => t.status === 'ACTIVE');
  const activePlayer = players.find((p: any) => p.id === activeTurn?.player_id);
  const isMyTurn = activePlayer?.anonymous_user_id === userId;
  const isHost = roomData?.host_user_id === userId;

  const status = roomData?.status;
  const theories = roomData?.theories || [];
  const myTheory = theories.find((t: any) => {
    const p = players.find((pl: any) => pl.id === t.player_id);
    return p?.anonymous_user_id === userId;
  });
  const timerSeconds = (() => { try { return JSON.parse(roomData?.settings || '{}').turn_timer_seconds ?? null; } catch { return null; } })();
  useEffect(() => {
    if (!timerSeconds || !activeTurn?.started_at) { setRemainingSeconds(null); return; }
    const update = () => { const elapsed = Math.floor((Date.now() - new Date(activeTurn.started_at).getTime()) / 1000); const remaining = Math.max(0, timerSeconds - elapsed); setRemainingSeconds(remaining); if (remaining === 0 && isMyTurn) socket?.emit('pass_turn', { roomId, userId }); };
    update(); const interval = window.setInterval(update, 1000); return () => window.clearInterval(interval);
  }, [activeTurn?.id, activeTurn?.started_at, timerSeconds, isMyTurn, roomId, socket, userId]);

   if (!roomData) return <Loading message="Recuperando o estado oficial da sala..." />;

   return (
    <div className="immersive-page game-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: `url(/backgrounds/cena-do-crime.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(31,42,48,0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '100%', overflowY: 'auto' }}>
         <div style={{ marginBottom: '24px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '32px', marginBottom: '8px', fontFamily: 'var(--font-serif)', lineHeight: 1.2 }}>{roomData.case_version?.case_ref?.title || 'O Quarto 7'}</h2>
            <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
              {status === 'IN_PROGRESS' ? `Investigação em andamento${remainingSeconds !== null ? ` · ${remainingSeconds}s` : ''}` : status === 'SOLVING' ? 'Formulando Teorias' : status === 'REVEAL' ? 'Revelação Final' : 'Fim de Jogo'}
            </div>
          </div>
          {status === 'IN_PROGRESS' && (
            <div className="game-header-actions"><button onClick={handleStartSolving} style={{ padding: '8px 16px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Tentar Resolver</button>{isHost && <button className="btn-secondary" onClick={() => socket?.emit('pause_room', { roomId, userId })}>Pausar</button>}</div>
          )}
        </div>

        {errorMessage && <div role="alert" style={{ padding: '12px 14px', marginBottom: '16px', border: '1px solid rgba(184,153,83,.5)', borderRadius: '8px', color: 'var(--gold-soft)', background: 'rgba(184,153,83,.08)' }}>{errorMessage}<button onClick={() => setErrorMessage('')} style={{ float: 'right', color: 'inherit' }}>Fechar</button></div>}
        {evaluationNotice && <div className="evaluation-notice"><span className="eyebrow">Avaliação da tentativa</span><strong>{Math.round(evaluationNotice.groupScore)}%</strong><p>{evaluationNotice.message}</p></div>}
        {questionWarning && <div role="alert" className="question-warning"><strong>{questionWarning.kind === 'repeat' ? 'Pergunta semelhante encontrada' : 'Reformule a pergunta'}</strong><p>{questionWarning.text}</p>{questionWarning.answer && <small>Resposta anterior: {questionWarning.answer}</small>}<div><button className="btn-secondary" onClick={() => setQuestionWarning(null)}>Reformular</button>{questionWarning.kind === 'repeat' && <button className="btn-primary" onClick={() => { setQuestionWarning(null); socket?.emit('submit_question', { roomId, userId, questionText: question, forceRepeat: true, idempotencyKey: `${roomId}:${userId}:${Date.now()}` }); }}>Enviar mesmo assim</button>}</div></div>}

        {activeVote && <div className="game-vote" role="dialog" aria-label="Votação ativa"><span className="eyebrow">Decisão da equipe</span><h3>{activeVote.type === 'START_SOLVING' ? 'Iniciar tentativa de solução?' : 'Escolha uma teoria'}</h3>{JSON.parse(activeVote.options || '[]').map((option: any) => <button key={option.id} className="btn-secondary" onClick={() => handleVote(option.id)}>{option.label || option.id}</button>)}</div>}

        {status === 'PAUSED' && <div className="game-paused"><span className="eyebrow">Sala pausada</span><h3>A investigação está em espera.</h3><p>Nenhum turno será consumido enquanto a sala estiver pausada.</p>{isHost && <button className="btn-primary" onClick={() => socket?.emit('resume_room', { roomId, userId })}>Retomar investigação</button>}</div>}

        {status === 'IN_PROGRESS' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
              {history.map((item, idx) => (
                <div key={idx} style={{ paddingLeft: '16px', borderLeft: '2px solid rgba(132,147,107,0.5)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '15px' }}>"{item.question?.original_text || item.questionText}"</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600, marginRight: '8px', fontFamily: 'var(--font-sans)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mestre:</span>
                    {item.answer?.rendered_text || item.responseText}
                  </div>
                  <div className="history-tools"><button onClick={() => requestClarification(item.question?.id)} disabled={!item.question?.id || item.clarification}>Esclarecer</button><button onClick={() => contestAnswer(item.question?.id)} disabled={!item.question?.id || item.contestation}>Contestar</button></div>
                  {item.clarification && <small className="history-followup">Esclarecimento: {item.clarification}</small>}
                  {item.contestation && <small className="history-followup">Revisão: {item.contestation}</small>}
                </div>
              ))}
            </div>

            <div style={{ padding: '12px', textAlign: 'center', marginBottom: '8px', backgroundColor: isMyTurn ? 'rgba(132,147,107,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isMyTurn ? 'var(--accent-olive)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: isMyTurn ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                {isMyTurn ? 'É a sua vez' : `Aguardando: ${activePlayer?.display_name || '...'}`}
              </div>
            </div>

            <div style={{ marginTop: 'auto', marginBottom: '80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
                <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={isMyTurn ? "Faça uma pergunta..." : "Aguarde sua vez..."} disabled={!isMyTurn || loading} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(31,42,48,0.6)', color: 'var(--text-primary)' }} />
                <button type="submit" disabled={!isMyTurn || !question.trim() || loading} style={{ padding: '0 24px', borderRadius: '8px', backgroundColor: isMyTurn && question.trim() ? 'var(--text-primary)' : 'rgba(255,255,255,0.1)', color: isMyTurn && question.trim() ? 'var(--bg-primary)' : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Enviar</button>
              </form>
              <div className="game-actions"><button onClick={handleHint} disabled={loading} className="btn-secondary">Usar pista ({Math.max(0, 3 - hints.length)})</button>{isMyTurn && <button onClick={handlePassTurn} disabled={loading} style={{ padding: '12px', backgroundColor: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-secondary)', borderRadius: '8px' }}>Passar a vez</button>}</div>
              {hints.map((hint) => <div key={hint.hintIndex} className="game-hint"><span className="eyebrow">Pista {hint.hintIndex}</span>{hint.content}<small>-{hint.penalty} pontos</small></div>)}
            </div>
          </>
        )}

        {status === 'SOLVING' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
            {myTheory ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ color: 'var(--accent-olive)' }}>Teoria Enviada!</h3>
                <p>Aguardando os outros investigadores...</p>
                <div style={{ marginTop: '16px' }}>{theories.length} de {players.length} teorias submetidas.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTheory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3>Montar Teoria Oculta</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Preencha os campos abaixo com o que você descobriu.</p>
                
                <label>O que aconteceu?</label>
                <input required type="text" value={theoryAnswers.what_happened} onChange={e => setTheoryAnswers({...theoryAnswers, what_happened: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#222', color: '#fff' }} />
                
                <label>Quem foi o responsável?</label>
                <input required type="text" value={theoryAnswers.who} onChange={e => setTheoryAnswers({...theoryAnswers, who: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#222', color: '#fff' }} />
                
                <label>Como foi feito?</label>
                <input required type="text" value={theoryAnswers.how} onChange={e => setTheoryAnswers({...theoryAnswers, how: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#222', color: '#fff' }} />

                <label>Qual foi o motivo?</label>
                <input required type="text" value={theoryAnswers.why} onChange={e => setTheoryAnswers({...theoryAnswers, why: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#222', color: '#fff' }} />

                <button type="submit" style={{ padding: '16px', background: 'var(--accent-gold)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginTop: '16px', cursor: 'pointer' }}>Enviar Minha Teoria</button>
              </form>
            )}
          </div>
        )}

        {status === 'REVEAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
            <div style={{ backgroundColor: 'rgba(132,147,107,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--accent-olive)' }}>
              <h3 style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>A Verdade</h3>
              {trueSolution ? <p style={{ fontSize: '16px', lineHeight: 1.6 }}>{trueSolution}</p> : <Loading message="Carregando solução..." fullPage={false} />}
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-serif)' }}>Teorias dos Investigadores</h3>
            {theories.map((t: any, idx: number) => {
              const author = players.find((p: any) => p.id === t.player_id);
              const answers = JSON.parse(t.answers);
              return (
                <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '8px' }}>Investigador: {author?.display_name}</div>
                  <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    <div><strong>O que:</strong> {answers.what_happened}</div>
                    <div><strong>Quem:</strong> {answers.who}</div>
                    <div><strong>Como:</strong> {answers.how}</div>
                    <div><strong>Motivo:</strong> {answers.why}</div>
                  </div>
                </div>
              );
            })}

            {isHost ? (
              <button onClick={handleFinishGame} disabled={loading || Boolean(activeVote)} style={{ padding: '16px', backgroundColor: 'var(--accent-olive)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}>
                {activeVote ? 'Aguardando votação...' : loading ? 'Calculando...' : 'Obter Avaliação do Mestre'}
              </button>
            ) : (
              <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Aguardando o anfitrião pedir a avaliação final...</p>
            )}
          </div>
        )}

        {status === 'GAME_OVER' && gameResult && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <h1 style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', fontSize: '48px', marginBottom: '8px' }}>Caso Encerrado</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px' }}>O Mestre avaliou as teorias.</p>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '32px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Precisão Geral da Equipe</div>
              <div style={{ fontSize: '72px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {Math.round(gameResult.groupScore)}<span style={{ fontSize: '32px', color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              {gameResult.evaluations.map((ev: any, idx: number) => {
                const author = players.find((p: any) => p.id === ev.playerId);
                return (
                  <div key={idx} style={{ backgroundColor: 'rgba(31,42,48,0.8)', padding: '24px', borderRadius: '12px', borderLeft: '4px solid var(--accent-olive)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{author?.display_name}</div>
                      <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '20px' }}>{ev.score}%</div>
                    </div>
                    <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.5 }}>"{ev.feedback}"</div>
                  </div>
                );
              })}
            </div>

            <div className="game-result-actions"><button className="btn-primary" onClick={() => navigate(`/room/${roomId}/feedback`)}>Responder feedback</button><button onClick={() => window.location.href = '/'} style={{ padding: '16px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '48px' }}>Voltar ao Início</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
