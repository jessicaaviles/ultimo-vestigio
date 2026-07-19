import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const [showCaseSummary, setShowCaseSummary] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(prev => prev + (prev ? ' ' : '') + transcript);
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  useEffect(() => {
    if (!socket || !roomId) return;
    const userId = localStorage.getItem('userId');
    socket.emit('join_room', { roomId, userId });

    socket.on('room_state_updated', (data) => setRoomData(data));

    socket.on('question_processed', (data) => {
      setLoading(false);
      setHistory(prev => [...prev, data]);
      setQuestion('');
    });

    socket.on('vote_started', (data) => setActiveVote(data));
    socket.on('vote_closed', () => setActiveVote(null));
    socket.on('hint_used', (data) => setHints(prev => [...prev, data]));
    socket.on('question_repeated', (data) => { setLoading(false); setQuestionWarning({ kind: 'repeat', text: `Uma pergunta parecida já foi feita: "${data.previous}"`, answer: data.answer }); });
    socket.on('question_needs_reformulation', (data) => { setLoading(false); setQuestionWarning({ kind: 'reformulate', text: data.message }); });
    socket.on('clarification_added', (data) => setHistory(prev => prev.map(item => item.question?.id === data.questionId ? { ...item, clarification: data.text } : item)));
    socket.on('contestation_resolved', (data) => setHistory(prev => prev.map(item => item.question?.id === data.questionId ? { ...item, contestation: data.text } : item)));

    socket.on('game_over', (data) => {
      setLoading(false);
      setGameResult(data);
      setTrueSolution(data.solution?.text || null);
    });
    socket.on('theory_evaluation', (data) => setEvaluationNotice(data));
    socket.on('room_error', (err) => { setLoading(false); setErrorMessage(String(err)); });

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
    if (!question.trim() || !isMyTurn || loading) return;
    setLoading(true);
    socket?.emit('submit_question', {
      roomId,
      userId: localStorage.getItem('userId'),
      questionText: question,
      forceRepeat: false,
      idempotencyKey: `${roomId}:${localStorage.getItem('userId')}:${Date.now()}`
    });
  };

  const handlePassTurn = () => socket?.emit('pass_turn', { roomId, userId: localStorage.getItem('userId') });
  const handleStartSolving = () => socket?.emit('start_solving', { roomId, userId: localStorage.getItem('userId') });
  const handleVote = (optionId: string) => { if (!activeVote) return; socket?.emit('cast_vote', { roomId, voteId: activeVote.id, userId, optionId }); };
  const handleHint = () => { const hintIndex = hints.length + 1; socket?.emit('use_hint', { roomId, userId, hintIndex, idempotencyKey: `${roomId}:${userId}:hint:${hintIndex}` }); };
  const requestClarification = (questionId: string) => socket?.emit('request_clarification', { roomId, userId, questionId });
  const contestAnswer = (questionId: string) => socket?.emit('contest_answer', { roomId, userId, questionId, reason: 'possible_contradiction' });
  const handleSubmitTheory = (e: React.FormEvent) => { e.preventDefault(); socket?.emit('submit_theory', { roomId, userId: localStorage.getItem('userId'), answers: theoryAnswers }); };
  const handleFinishGame = () => { setLoading(true); socket?.emit('finish_game', { roomId, userId: localStorage.getItem('userId') }); };

  const userId = localStorage.getItem('userId');
  const players = roomData?.players || [];
  const activeTurn = roomData?.turns?.find((t: any) => t.status === 'ACTIVE');
  const activePlayer = players.find((p: any) => p.id === activeTurn?.player_id);
  const isMyTurn = activePlayer?.anonymous_user_id === userId;
  const isHost = roomData?.host_user_id === userId;
  const status = roomData?.status;
  const theories = roomData?.theories || [];
  const myTheory = theories.find((t: any) => { const p = players.find((pl: any) => pl.id === t.player_id); return p?.anonymous_user_id === userId; });
  const caseTitle = roomData?.case_version?.case_ref?.title || 'Investigação';
  const caseSynopsis = roomData?.case_version?.case_ref?.short_synopsis || '';
  const caseOpening = roomData?.case_version?.opening || '';
  const timerSeconds = (() => { try { return JSON.parse(roomData?.settings || '{}').turn_timer_seconds ?? null; } catch { return null; } })();

  useEffect(() => {
    if (!timerSeconds || !activeTurn?.started_at) { setRemainingSeconds(null); return; }
    const update = () => { const elapsed = Math.floor((Date.now() - new Date(activeTurn.started_at).getTime()) / 1000); const remaining = Math.max(0, timerSeconds - elapsed); setRemainingSeconds(remaining); if (remaining === 0 && isMyTurn) socket?.emit('pass_turn', { roomId, userId }); };
    update(); const interval = window.setInterval(update, 1000); return () => window.clearInterval(interval);
  }, [activeTurn?.id, activeTurn?.started_at, timerSeconds, isMyTurn, roomId, socket, userId]);

  if (!roomData) return <Loading message="Recuperando o estado oficial da sala..." />;

  // Estilos reutilizáveis
  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(184,153,83,0.25)',
    backgroundColor: 'rgba(15,20,23,0.6)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: '15px',
    outline: 'none'
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--accent-gold)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: '6px'
  };
  const cardStyle: React.CSSProperties = {
    background: 'rgba(15,20,23,0.55)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(184,153,83,0.15)',
    borderRadius: '12px',
    padding: '16px'
  };

  return (
    <div className="immersive-page is-fixed-height" style={{
      backgroundColor: '#0F1417',
      backgroundImage: `url(/backgrounds/cena-do-crime.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(15,20,23,0.92) 0%, rgba(15,20,23,0.78) 50%, rgba(15,20,23,0.95) 100%)', zIndex: 0 }} />

      {/* Conteúdo principal — container scrollável */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        paddingTop: '88px',
        paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 24px)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100%' }}>

          {/* Header do caso */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', lineHeight: 1.2, margin: 0, marginBottom: '4px' }}>{caseTitle}</h2>
              <div style={labelStyle}>
                {status === 'IN_PROGRESS' ? `Investigação em andamento${remainingSeconds !== null ? ` · ${remainingSeconds}s` : ''}` :
                 status === 'SOLVING' ? 'Formulando Teorias' :
                 status === 'REVEAL' ? 'Revelação Final' :
                 status === 'PAUSED' ? '⏸ Pausada' : 'Fim de Jogo'}
              </div>
            </div>
            {status === 'IN_PROGRESS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '12px' }}>
                <button onClick={handleStartSolving} style={{ padding: '8px 14px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>Tentar Resolver</button>
                {isHost && <button style={{ padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }} onClick={() => socket?.emit('pause_room', { roomId, userId })}>Pausar</button>}
              </div>
            )}
          </div>

          {/* Banner: Resumo do Caso */}
          {(caseSynopsis || caseOpening) && (
            <div style={{ ...cardStyle, borderColor: 'rgba(184,153,83,0.3)' }}>
              <button
                onClick={() => setShowCaseSummary(v => !v)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, color: 'inherit' }}
              >
                <span style={{ ...labelStyle, marginBottom: 0 }}>📋 Resumo do Caso</span>
                <span style={{ color: 'var(--accent-gold)', fontSize: '14px', lineHeight: 1 }}>{showCaseSummary ? '▲' : '▼'}</span>
              </button>
              {showCaseSummary && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {caseSynopsis && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{caseSynopsis}</p>}
                  {caseOpening && caseSynopsis !== caseOpening && (
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{caseOpening}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Alertas */}
          {errorMessage && (
            <div role="alert" style={{ ...cardStyle, borderColor: 'rgba(220,80,80,0.4)', background: 'rgba(220,80,80,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#ff9999', fontSize: '14px' }}>{errorMessage}</span>
                <button onClick={() => setErrorMessage('')} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
              </div>
            </div>
          )}

          {evaluationNotice && (
            <div style={{ ...cardStyle, borderColor: 'rgba(132,147,107,0.5)', background: 'rgba(132,147,107,0.12)' }}>
              <div style={labelStyle}>Avaliação da tentativa</div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', marginBottom: '8px' }}>{Math.round(evaluationNotice.groupScore)}%</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>{evaluationNotice.message}</p>
            </div>
          )}

          {questionWarning && (
            <div role="alert" style={{ ...cardStyle, borderColor: 'rgba(184,153,83,0.4)', background: 'rgba(184,153,83,0.08)' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {questionWarning.kind === 'repeat' ? '🔄 Pergunta similar já feita' : '⚠️ Reformule a pergunta'}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 12px' }}>{questionWarning.text}</p>
              {questionWarning.answer && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '12px', fontStyle: 'italic' }}>Resposta anterior: {questionWarning.answer}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }} onClick={() => setQuestionWarning(null)}>Reformular</button>
                {questionWarning.kind === 'repeat' && (
                  <button style={{ flex: 1, padding: '10px', background: 'var(--accent-gold)', border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }} onClick={() => { setQuestionWarning(null); socket?.emit('submit_question', { roomId, userId, questionText: question, forceRepeat: true, idempotencyKey: `${roomId}:${userId}:${Date.now()}` }); }}>
                    Enviar mesmo assim
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Votação ativa */}
          {activeVote && (
            <div role="dialog" style={{ ...cardStyle, borderColor: 'rgba(132,147,107,0.4)', background: 'rgba(132,147,107,0.1)' }}>
              <div style={labelStyle}>Decisão da equipe</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 16px', fontSize: '20px' }}>{activeVote.type === 'START_SOLVING' ? 'Iniciar tentativa de solução?' : 'Escolha uma teoria'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {JSON.parse(activeVote.options || '[]').map((option: any) => (
                  <button key={option.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleVote(option.id)}>{option.label || option.id}</button>
                ))}
              </div>
            </div>
          )}

          {/* Sala pausada */}
          {status === 'PAUSED' && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏸</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 8px' }}>Investigação em espera</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 20px' }}>Nenhum turno será consumido enquanto a sala estiver pausada.</p>
              {isHost && <button style={{ padding: '12px 24px', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }} onClick={() => socket?.emit('resume_room', { roomId, userId })}>Retomar investigação</button>}
            </div>
          )}

          {/* Status: IN_PROGRESS */}
          {status === 'IN_PROGRESS' && (
            <>
              {/* Jogadores */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {players.map((p: any) => {
                  const isActive = p.id === activeTurn?.player_id;
                  const isMe = p.anonymous_user_id === userId;
                  return (
                    <div key={p.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', border: `1px solid ${isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}`, background: isActive ? 'rgba(184,153,83,0.15)' : 'rgba(255,255,255,0.04)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: '12px', color: isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.6)', fontWeight: isActive ? 700 : 400 }}>
                        {p.display_name || 'Investigador'}{isMe ? ' (você)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Indicador de turno */}
              <div style={{ ...cardStyle, textAlign: 'center', borderColor: isMyTurn ? 'rgba(184,153,83,0.5)' : 'rgba(255,255,255,0.08)', background: isMyTurn ? 'rgba(184,153,83,0.12)' : 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: isMyTurn ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                  {isMyTurn ? '✦ É a sua vez' : `Aguardando: ${activePlayer?.display_name || '...'}`}
                </div>
              </div>

              {/* Histórico de perguntas */}
              {history.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {history.map((item, idx) => (
                    <div key={idx} style={{ paddingLeft: '14px', borderLeft: '2px solid rgba(184,153,83,0.35)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '6px', color: '#fff', fontSize: '14px', fontStyle: 'italic' }}>
                        "{item.question?.original_text || item.questionText}"
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--accent-gold)', fontWeight: 700, marginRight: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mestre:</span>
                        {item.answer?.rendered_text || item.responseText}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button onClick={() => requestClarification(item.question?.id)} disabled={!item.question?.id || item.clarification} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>Esclarecer</button>
                        <button onClick={() => contestAnswer(item.question?.id)} disabled={!item.question?.id || item.contestation} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>Contestar</button>
                      </div>
                      {item.clarification && <div style={{ marginTop: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Esclarecimento: {item.clarification}</div>}
                      {item.contestation && <div style={{ marginTop: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Revisão: {item.contestation}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Pistas usadas */}
              {hints.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {hints.map((hint) => (
                    <div key={hint.hintIndex} style={{ ...cardStyle, borderColor: 'rgba(132,147,107,0.4)', background: 'rgba(132,147,107,0.08)' }}>
                      <div style={labelStyle}>Pista {hint.hintIndex}</div>
                      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{hint.content}</p>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>−{hint.penalty} pontos</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Área de ação: formulário + botões */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={isMyTurn ? 'Faça uma pergunta de sim ou não...' : 'Aguarde sua vez...'}
                      disabled={!isMyTurn || loading}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {isMyTurn && !loading && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        disabled={!isMyTurn || loading}
                        style={{
                          padding: '0 14px', borderRadius: '10px', border: 'none',
                          backgroundColor: listening ? '#d79b8e' : 'rgba(255,255,255,0.08)',
                          color: listening ? '#000' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', fontSize: '18px', transition: 'all 0.2s'
                        }}
                        title={listening ? 'Gravando... clique para parar' : 'Perguntar por voz'}
                      >
                        {listening ? '■' : '🎤'}
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!isMyTurn || !question.trim() || loading}
                    style={{ padding: '14px 20px', borderRadius: '10px', backgroundColor: (isMyTurn && question.trim() && !loading) ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)', color: (isMyTurn && question.trim() && !loading) ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  >
                    {loading ? '...' : 'Enviar'}
                  </button>
                </form>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleHint}
                    disabled={loading || hints.length >= 3}
                    style={{ flex: 1, padding: '12px', background: 'rgba(132,147,107,0.15)', border: '1px solid rgba(132,147,107,0.3)', borderRadius: '10px', color: hints.length >= 3 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', cursor: hints.length >= 3 ? 'default' : 'pointer', fontWeight: 600, fontSize: '13px' }}
                  >
                    Usar Pista ({Math.max(0, 3 - hints.length)})
                  </button>
                  {isMyTurn && (
                    <button
                      onClick={handlePassTurn}
                      disabled={loading}
                      style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                      Passar a vez
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Status: SOLVING */}
          {status === 'SOLVING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: 0 }}>Formular Teoria</h3>
              {myTheory ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', margin: '0 0 8px' }}>Teoria Enviada!</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>Aguardando os outros investigadores...</p>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{theories.length} de {players.length} teorias submetidas.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmitTheory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>Com base na investigação, preencha o que você descobriu.</p>
                  {[
                    { key: 'what_happened', label: 'O que aconteceu?' },
                    { key: 'who', label: 'Quem foi o responsável?' },
                    { key: 'how', label: 'Como foi feito?' },
                    { key: 'why', label: 'Qual foi o motivo?' }
                  ].map(({ key, label }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        required
                        type="text"
                        value={theoryAnswers[key]}
                        onChange={e => setTheoryAnswers({ ...theoryAnswers, [key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <button type="submit" style={{ padding: '16px', background: 'var(--accent-gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: '10px', marginTop: '8px', cursor: 'pointer', fontSize: '15px' }}>
                    Enviar Minha Teoria
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Status: REVEAL */}
          {status === 'REVEAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ ...cardStyle, borderColor: 'rgba(184,153,83,0.4)', background: 'rgba(184,153,83,0.08)' }}>
                <div style={labelStyle}>A Verdade Revelada</div>
                {trueSolution ? <p style={{ fontSize: '15px', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-serif)', color: 'rgba(255,255,255,0.9)' }}>{trueSolution}</p> : <Loading message="Carregando solução..." fullPage={false} />}
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '20px' }}>Teorias dos Investigadores</h3>
              {theories.map((t: any, idx: number) => {
                const author = players.find((p: any) => p.id === t.player_id);
                const answers = JSON.parse(t.answers);
                return (
                  <div key={idx} style={cardStyle}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '10px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Investigador: {author?.display_name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                      <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>O que:</strong> {answers.what_happened}</div>
                      <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Quem:</strong> {answers.who}</div>
                      <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Como:</strong> {answers.how}</div>
                      <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Motivo:</strong> {answers.why}</div>
                    </div>
                  </div>
                );
              })}

              {isHost ? (
                <button onClick={handleFinishGame} disabled={loading || Boolean(activeVote)} style={{ padding: '16px', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
                  {activeVote ? 'Aguardando votação...' : loading ? 'Calculando...' : 'Obter Avaliação do Mestre'}
                </button>
              ) : (
                <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>Aguardando o anfitrião pedir a avaliação final...</p>
              )}
            </div>
          )}

          {/* Status: GAME_OVER */}
          {status === 'GAME_OVER' && gameResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
              <div>
                <h1 style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', fontSize: '40px', margin: '0 0 8px' }}>Caso Encerrado</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', margin: 0 }}>O Mestre avaliou as teorias.</p>
              </div>

              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ ...labelStyle, marginBottom: '12px' }}>Precisão Geral da Equipe</div>
                <div style={{ fontSize: '64px', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', lineHeight: 1 }}>
                  {Math.round(gameResult.groupScore)}<span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.5)' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                {gameResult.evaluations.map((ev: any, idx: number) => {
                  const author = players.find((p: any) => p.id === ev.playerId);
                  return (
                    <div key={idx} style={{ ...cardStyle, borderLeft: '3px solid var(--accent-gold)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{author?.display_name}</div>
                        <div style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '20px' }}>{ev.score}%</div>
                      </div>
                      <div style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, fontSize: '14px' }}>"{ev.feedback}"</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button style={{ padding: '16px', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }} onClick={() => navigate(`/room/${roomId}/feedback`)}>
                  Responder feedback
                </button>
                <button onClick={() => window.location.href = '/'} style={{ padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                  Voltar ao Início
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Game;
