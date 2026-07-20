import express from 'express';
import crypto from 'crypto';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { processQuestion, evaluateTheory } from './services/aiMaster';
import { revealSecret } from './security/secrets';
import { normalizeQuestion } from './game/rules';

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : undefined;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendUrl || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const prisma = new PrismaClient();
const requestWindows = new Map<string, { startedAt: number; count: number }>();

const roomState = async (roomId: string) => {
  const room = await prisma.rooms.findUnique({
    where: { id: roomId },
    include: {
      players: { orderBy: { turn_order: 'asc' }, include: { user: { select: { id: true, default_display_name: true, profile_photo_data: true, generated_profile_photo_data: true } } } },
      turns: { where: { status: 'ACTIVE' } },
      theories: { select: { id: true, player_id: true, attempt_number: true, answers: true, status: true, submitted_at: true } },
      case_version: { select: { opening: true, case_ref: { select: { slug: true, title: true, short_synopsis: true, difficulty: true, estimated_duration_minutes: true } } } },
      questions: { orderBy: { sequence_number: 'asc' }, include: { master_answers: { orderBy: { created_at: 'asc' } }, interpretation: true } }
    }
  });
  if (!room) return null;
  const activeVote = await prisma.votes.findFirst({ where: { room_id: roomId, status: 'OPEN' } });
  
  const priorEvaluation = await prisma.theory_evaluations.findFirst({ where: { room_id: roomId }, orderBy: { attempt_number: 'desc' } });
  const currentAttemptNumber = priorEvaluation ? priorEvaluation.attempt_number + 1 : 1;
  const activeTheories = room.theories.filter(t => t.attempt_number === currentAttemptNumber);

  return {
    ...room,
    case_version_id: room.case_version_id,
    theories: room.status === 'SOLVING' ? activeTheories.map(({ answers: _answers, ...theory }) => theory) : activeTheories,
    activeVote
  };
};

const emitRoomState = async (roomId: string) => {
  const state = await roomState(roomId);
  if (state) {
    const [usages, caseHints] = await Promise.all([
      prisma.hint_usages.findMany({ where: { room_id: roomId } }),
      prisma.case_hints.findMany({ where: { case_version_id: state.case_version_id } }),
    ]);
    const hintMap = new Map(caseHints.map(h => [h.hint_index, revealSecret(h.content_encrypted)]));
    const hintContents = usages.map(u => ({
      hintIndex: u.hint_index,
      content: hintMap.get(u.hint_index) || 'Pista indisponível',
      penalty: u.penalty,
    }));
    io.to(roomId).emit('room_state_updated', { ...state, hint_usages: hintContents });
  }
};

const recordAnalytics = async (event_name: string, room_id?: string, anonymous_hash?: string, payload: object = {}) => {
  await prisma.analytics_events.create({ data: { event_name, room_id, anonymous_hash, payload: JSON.stringify(payload) } }).catch(() => undefined);
};

const recordRoomEvent = async (room_id: string, event_type: string, payload: object = {}, actor_player_id?: string) => {
  const event_version = await prisma.room_events.count({ where: { room_id } }) + 1;
  await prisma.room_events.create({ data: { room_id, event_type, actor_player_id, aggregate_type: 'ROOM', event_version, idempotency_key: `${room_id}:${event_type}:${event_version}`, payload: JSON.stringify(payload) } }).catch(() => undefined);
};

app.use(cors({
  origin: frontendUrl ? [frontendUrl] : '*',
  credentials: true
}));
app.use(express.json({ limit: '7mb' }));
app.use('/api', (req, res, next) => {
  const key = req.ip || 'unknown'; const now = Date.now(); const current = requestWindows.get(key);
  if (!current || now - current.startedAt > 60_000) requestWindows.set(key, { startedAt: now, count: 1 });
  else { current.count += 1; if (current.count > 120) return res.status(429).json({ success: false, error: 'Too many requests' }); }
  next();
});

import userRoutes from './routes/userRoutes';
import roomRoutes from './routes/roomRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import profileRoutes from './routes/profileRoutes';
import authRoutes from './routes/authRoutes';

// Routes
app.use('/api', userRoutes);
app.use('/api', roomRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', profileRoutes);
app.use('/api', authRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Socket connected');

  socket.on('join_room', async ({ roomId, userId }) => {
    socket.data.roomId = roomId;
    socket.data.userId = userId;
    socket.join(roomId);
    console.log('Player joined a room');
    
    // Atualiza status do jogador para CONNECTED (se existir)
    if (userId) {
      try {
        await prisma.room_players.updateMany({
          where: { room_id: roomId, anonymous_user_id: userId },
          data: { connection_status: 'CONNECTED', last_seen_at: new Date() }
        });
      } catch (err) {
        console.error("Erro ao atualizar status do jogador:", err);
      }
    }

    // Busca o estado atualizado da sala e envia
    try {
      await emitRoomState(roomId);
      await recordAnalytics('player_reconnected', roomId, userId);
    } catch (err) {
      console.error("Erro ao emitir estado da sala:", err);
    }
  });

  socket.on('typing', ({ roomId, userId, typing }) => {
    console.log(`[typing] room: ${roomId}, user: ${userId}, typing: ${typing}`);
    socket.to(roomId).emit('player_typing', { userId, typing });
  });

  socket.on('start_game', async ({ roomId, userId }) => {
    try {
      const room = await prisma.rooms.findUnique({ where: { id: roomId }, include: { players: true } });
      if (!room || room.host_user_id !== userId) return;
      console.log('[start_game] players:', room.players.map(p => ({ id: p.anonymous_user_id, name: p.display_name, conn: p.connection_status })));
      const activePlayers = room.players.filter(p => p.connection_status === 'CONNECTED');
      if (activePlayers.length < 2) {
        socket.emit('room_error', `A sala precisa ter pelo menos dois jogadores conectados. Atualmente: ${room.players.length} jogador(es), ${activePlayers.length} conectado(s).`);
        return;
      }

      // 1. Embaralhar jogadores
      const players = [...room.players];
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }

      await prisma.$transaction(async (tx) => {
        // 2. Definir ordem de turno para cada jogador
        for (let i = 0; i < players.length; i++) {
          await tx.room_players.update({
            where: { id: players[i].id },
            data: { turn_order: i }
          });
        }

        // 3. Criar turno inicial para o jogador 0
        const firstTurn = await tx.turns.create({
          data: {
            room_id: roomId,
            player_id: players[0].id,
            round_number: 1,
            order_index: 0,
            status: 'ACTIVE',
            started_at: new Date()
          }
        });

        // 4. Atualizar sala
        await tx.rooms.update({
          where: { id: roomId },
          data: {
            status: 'IN_PROGRESS',
            current_round: 1,
            current_turn_id: firstTurn.id
          }
        });
      });

      // 5. Emitir game_started
      const updatedRoom = await roomState(roomId);
      io.to(roomId).emit('game_started', updatedRoom);
      await emitRoomState(roomId);
      await recordAnalytics('game_started', roomId, userId);
      await recordRoomEvent(roomId, 'game_started');
      
    } catch (error) {
      console.error("Erro ao iniciar jogo:", error);
    }
  });

  socket.on('player_ready', async ({ roomId, userId, ready = true }) => {
    await prisma.room_players.updateMany({ where: { room_id: roomId, anonymous_user_id: userId }, data: { ready_status: ready ? 'READY' : 'NOT_READY' } });
    await emitRoomState(roomId);
    await recordAnalytics('player_ready', roomId, userId, { ready: Boolean(ready) });
    await recordRoomEvent(roomId, 'player_ready', { ready: Boolean(ready) });
  });

  socket.on('pass_turn', async ({ roomId, userId, turnId }) => {
    console.log(`[PASS_TURN] Recebido para room=${roomId}, user=${userId}, turnId=${turnId}`);
    try {
      const room = await prisma.rooms.findUnique({
        where: { id: roomId },
        include: { players: { orderBy: { turn_order: 'asc' } } }
      });
      if (!room || room.status !== 'IN_PROGRESS' || !room.current_turn_id) {
        console.log(`[PASS_TURN] Falhou: sala inválida ou não IN_PROGRESS`);
        return;
      }

      // Se foi fornecido um turnId, garante que só passa se for o turno atual
      if (turnId && room.current_turn_id !== turnId) {
        console.log(`[PASS_TURN] Falhou: turnId diverge (${room.current_turn_id} != ${turnId})`);
        return;
      }

      const currentTurn = await prisma.turns.findUnique({ where: { id: room.current_turn_id } });
      if (!currentTurn) {
        console.log(`[PASS_TURN] Falhou: turno atual não encontrado`);
        return;
      }

      const currentPlayer = room.players.find(p => p.id === currentTurn.player_id);
      
      const settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : (room.settings as any);
      const turnTimer = settings?.turn_timer_seconds || 120;
      const startedAt = currentTurn.started_at ? currentTurn.started_at.getTime() : Date.now();
      const timeElapsed = (Date.now() - startedAt) / 1000;
      const isTimeUp = timeElapsed >= turnTimer;

      console.log(`[PASS_TURN] isTimeUp=${isTimeUp}, timeElapsed=${timeElapsed}, turnTimer=${turnTimer}`);

      if (!currentPlayer || (currentPlayer.anonymous_user_id !== userId && !isTimeUp && room.host_user_id !== userId)) {
        console.log(`[PASS_TURN] Rejeitado: Não é a vez e o tempo não esgotou.`);
        socket.emit('room_error', 'Não é a sua vez. Aguarde o jogador atual concluir.');
        return;
      }
      
      console.log(`[PASS_TURN] Iniciando transação para passar o turno...`);

      await prisma.$transaction(async (tx) => {
        // Finaliza turno atual
        await tx.turns.update({
          where: { id: currentTurn.id },
          data: { status: 'PASSED', passed_at: new Date() }
        });

        // Próximo jogador
        const nextOrderIndex = (currentTurn.order_index + 1) % room.players.length;
        const nextRoundNumber = nextOrderIndex === 0 ? currentTurn.round_number + 1 : currentTurn.round_number;
        const nextPlayer = room.players.find(p => p.turn_order === nextOrderIndex);
        
        if (!nextPlayer) return;

        // Cria o próximo turno
        const newTurn = await tx.turns.create({
          data: {
            room_id: room.id,
            player_id: nextPlayer.id,
            round_number: nextRoundNumber,
            order_index: nextOrderIndex,
            status: 'ACTIVE',
            started_at: new Date()
          }
        });

        // Atualiza a sala
        await tx.rooms.update({
          where: { id: room.id },
          data: {
            current_turn_id: newTurn.id,
            current_round: nextRoundNumber
          }
        });
      });

      // Busca e emite o novo estado da sala
      await emitRoomState(roomId);

    } catch (err) {
      console.error("Erro ao passar o turno:", err);
    }
  });

  socket.on('submit_question', async ({ roomId, userId, questionText, idempotencyKey, forceRepeat = false }) => {
    try {
      const room = await prisma.rooms.findUnique({
        where: { id: roomId },
        include: { players: { orderBy: { turn_order: 'asc' } } }
      });
      if (!room || room.status !== 'IN_PROGRESS' || !room.current_turn_id) return;
      const cleanQuestion = normalizeQuestion(String(questionText || ''));
      if (!cleanQuestion || String(questionText || '').length > 500) {
        socket.emit('room_error', 'A pergunta deve ter entre 1 e 500 caracteres.');
        return;
      }
      if (idempotencyKey) {
        const previous = await prisma.questions.findUnique({ where: { idempotency_key: String(idempotencyKey) } });
        if (previous) {
          socket.emit('room_error', 'Esta pergunta já foi processada.');
          return;
        }
      }

      const currentTurn = await prisma.turns.findUnique({ where: { id: room.current_turn_id } });
      if (!currentTurn) return;

      const currentPlayer = room.players.find(p => p.id === currentTurn.player_id);
      if (!currentPlayer || currentPlayer.anonymous_user_id !== userId) {
        socket.emit('room_error', 'Não é a sua vez. Aguarde o jogador atual concluir.');
        return;
      }

      const previousQuestions = await prisma.questions.findMany({ where: { room_id: roomId }, orderBy: { sequence_number: 'desc' }, take: 20, include: { master_answers: true } });
      const questionWords = new Set(cleanQuestion.toLocaleLowerCase('pt-BR').split(/\W+/).filter((word: string) => word.length > 3));
      const repeated = previousQuestions.find((previous) => {
        const previousWords = new Set(previous.original_text.toLocaleLowerCase('pt-BR').split(/\W+/).filter((word: string) => word.length > 3));
        const overlap = [...questionWords].filter((word) => previousWords.has(word)).length;
        return previous.original_text.toLocaleLowerCase() === cleanQuestion.toLocaleLowerCase() || (overlap >= 2 && overlap / Math.max(questionWords.size, previousWords.size) >= .7);
      });
      if (repeated && !forceRepeat) {
        socket.emit('question_repeated', { previous: repeated.original_text, answer: repeated.master_answers[0]?.rendered_text || '' });
        return;
      }

      io.to(roomId).emit('question_processing', { userId });

      // 1. Processar Pergunta no Mestre IA (Gemini)
      const aiResponse = await processQuestion(roomId, cleanQuestion, room.case_version_id);

      // Classificações que pedem reformulação semântica
      if (['AMBIGUOUS', 'MULTI_PREMISE', 'BLOCKED'].includes(aiResponse.classification)) {
        socket.emit('question_needs_reformulation', { classification: aiResponse.classification, message: aiResponse.rendered_text });
        return;
      }

      // Falha TÉCNICA do Mestre IA (fallback_used=true) — não salvar, pedir nova tentativa
      // ATENÇÃO: classification=UNKNOWN com fallback_used=false é resposta VÁLIDA do jogo
      if (aiResponse.fallback_used === true) {
        socket.emit('question_needs_reformulation', {
          classification: 'TECHNICAL_ERROR',
          message: aiResponse.rendered_text
        });
        return;
      }

      let newTurnId = room.current_turn_id;
      let nextRoundNumber = room.current_round;
      let createdQuestionId = '';

      await prisma.$transaction(async (tx) => {
        // 2. Salvar Pergunta no DB
        const questionCount = await tx.questions.count({ where: { room_id: roomId } });
        const question = await tx.questions.create({
          data: {
            room_id: roomId,
            turn_id: currentTurn.id,
            player_id: currentPlayer.id,
            sequence_number: questionCount + 1,
            original_text: cleanQuestion,
            idempotency_key: idempotencyKey ? String(idempotencyKey) : undefined,
            repeated_question_id: repeated?.id,
            status: 'PROCESSED'
          }
        });
        createdQuestionId = question.id;

        // 3. Salvar Resposta no DB
        await tx.master_answers.create({
          data: {
            question_id: question.id,
            classification: aiResponse.classification,
            factual_payload: '{}',
            rendered_text: aiResponse.rendered_text,
            validation_status: 'VALID',
            model_name: 'gemini-3.5-flash'
          }
        });

        // 4. Passar o Turno (igual ao pass_turn)
        await tx.turns.update({
          where: { id: currentTurn.id },
          data: { status: 'COMPLETED', completed_at: new Date() }
        });

        const nextOrderIndex = (currentTurn.order_index + 1) % room.players.length;
        nextRoundNumber = nextOrderIndex === 0 ? currentTurn.round_number + 1 : currentTurn.round_number;
        const nextPlayer = room.players.find(p => p.turn_order === nextOrderIndex);

        if (nextPlayer) {
          const newTurn = await tx.turns.create({
            data: {
              room_id: room.id,
              player_id: nextPlayer.id,
              round_number: nextRoundNumber,
              order_index: nextOrderIndex,
              status: 'ACTIVE',
              started_at: new Date()
            }
          });
          newTurnId = newTurn.id;
        }

        await tx.rooms.update({
          where: { id: room.id },
          data: { current_turn_id: newTurnId, current_round: nextRoundNumber }
        });
      });

      // 5. Emitir Resultados
       io.to(roomId).emit('question_processed', {
         question: { id: createdQuestionId, original_text: cleanQuestion },
        answer: { rendered_text: aiResponse.rendered_text },
        askedBy: userId
      });

       await emitRoomState(roomId);
       await recordAnalytics('question_sent', roomId, userId);
       await recordRoomEvent(roomId, 'question_submitted', { textLength: cleanQuestion.length });

    } catch (err) {
      console.error("Erro em submit_question:", err);
      socket.emit('error', 'Falha ao processar pergunta.');
    }
  });

  socket.on('request_clarification', async ({ roomId, userId, questionId }) => {
    try {
      const question = await prisma.questions.findUnique({ where: { id: questionId }, include: { master_answers: true } });
      const player = await prisma.room_players.findFirst({ where: { room_id: roomId, anonymous_user_id: userId } });
      if (!question || !player || question.room_id !== roomId || question.clarification_count >= 1) return socket.emit('room_error', 'Este item já recebeu um esclarecimento.');
      const answer = question.master_answers[0]; if (!answer) return;
      const clarification = `O Mestre confirma o sentido da resposta anterior: ${answer.rendered_text}`;
      await prisma.$transaction([
        prisma.question_clarifications.create({ data: { question_id: questionId, requested_by: userId, response_text: clarification } }),
        prisma.questions.update({ where: { id: questionId }, data: { clarification_count: { increment: 1 } } })
      ]);
      io.to(roomId).emit('clarification_added', { questionId, text: clarification });
      await recordRoomEvent(roomId, 'clarification_requested', { questionId });
    } catch { socket.emit('room_error', 'Não foi possível esclarecer esta resposta.'); }
  });

  socket.on('contest_answer', async ({ roomId, userId, questionId, reason, comment }) => {
    try {
      const player = await prisma.room_players.findFirst({ where: { room_id: roomId, anonymous_user_id: userId } });
      const question = await prisma.questions.findUnique({ where: { id: questionId } });
      if (!player || !question || question.room_id !== roomId) return;
      const contestation = await prisma.answer_contestations.create({ data: { question_id: questionId, reported_by: userId, reason: String(reason || 'other').slice(0, 80), comment: String(comment || '').slice(0, 500) || null, status: 'REVIEWED', correction_text: 'A resposta foi revisada e permanece válida com base nos fatos disponíveis.', resolved_at: new Date() } });
      io.to(roomId).emit('contestation_resolved', { questionId, text: contestation.correction_text, status: contestation.status });
      await recordRoomEvent(roomId, 'answer_contested', { questionId, reason: contestation.reason });
    } catch { socket.emit('room_error', 'Não foi possível registrar a contestação.'); }
  });

  socket.on('start_solving', async ({ roomId, userId }) => {
    try {
      const room = await prisma.rooms.findUnique({ where: { id: roomId }, include: { players: true } });
      if (!room || room.status !== 'IN_PROGRESS') return;
      if (!room.players.some(player => player.anonymous_user_id === userId)) return;

      const existingVote = await prisma.votes.findFirst({ where: { room_id: roomId, type: 'START_SOLVING', status: 'OPEN' } });
      if (existingVote) return socket.emit('vote_started', existingVote);

      const vote = await prisma.votes.create({ data: { room_id: roomId, type: 'START_SOLVING', options: JSON.stringify([{ id: 'yes', label: 'Iniciar tentativa' }, { id: 'continue', label: 'Continuar investigando' }]), status: 'OPEN' } });
      io.to(roomId).emit('vote_started', vote);
      await recordAnalytics('theory_started', roomId, userId);
    } catch (err) {
      console.error("Erro em start_solving:", err);
    }
  });

  socket.on('use_hint', async ({ roomId, userId, hintIndex, idempotencyKey }) => {
    try {
      const room = await prisma.rooms.findUnique({ where: { id: roomId }, include: { case_version: true } });
      if (!room || room.status !== 'IN_PROGRESS') return;
      const hint = await prisma.case_hints.findFirst({ where: { case_version_id: room.case_version_id, hint_index: Number(hintIndex) } });
      if (!hint) return socket.emit('room_error', 'Pista indisponível.');
      const usage = await prisma.hint_usages.create({ data: { room_id: roomId, hint_index: hint.hint_index, requested_by: userId, penalty: hint.penalty_points, idempotency_key: String(idempotencyKey || crypto.randomUUID()) } }).catch(() => null);
      if (!usage) return socket.emit('room_error', 'Esta pista já foi solicitada.');
      io.to(roomId).emit('hint_used', { hintIndex: hint.hint_index, content: revealSecret(hint.content_encrypted), penalty: hint.penalty_points });
      await recordAnalytics('hint_used', roomId, userId, { hintIndex: hint.hint_index });
      await recordRoomEvent(roomId, 'hint_used', { hintIndex: hint.hint_index });
    } catch { socket.emit('room_error', 'Não foi possível usar a pista.'); }
  });

  socket.on('typing', ({ roomId, userId, typing }) => {
    if (roomId && userId) {
      socket.to(roomId).emit('player_typing', { userId, typing });
    }
  });

  socket.on('cast_vote', async ({ roomId, voteId, userId, optionId }) => {
    try {
      const player = await prisma.room_players.findFirst({ where: { room_id: roomId, anonymous_user_id: userId } });
      const vote = await prisma.votes.findUnique({ where: { id: voteId }, include: { responses: true } });
      if (!player || !vote || vote.room_id !== roomId || vote.status !== 'OPEN') return;
      await prisma.vote_responses.upsert({ where: { vote_id_player_id: { vote_id: voteId, player_id: player.id } }, update: { option_id: String(optionId) }, create: { vote_id: voteId, player_id: player.id, option_id: String(optionId) } });
      const responses = await prisma.vote_responses.findMany({ where: { vote_id: voteId } });
      const room = await prisma.rooms.findUnique({ where: { id: roomId }, include: { players: true } });
      const counts = responses.reduce<Record<string, number>>((all, response) => ({ ...all, [response.option_id]: (all[response.option_id] || 0) + 1 }), {});
      const activePlayersCount = room?.players.filter(p => p.connection_status === 'CONNECTED').length || 1;
      const majority = Math.floor(activePlayersCount / 2) + 1;
      const winningOption = Object.entries(counts).find(([, count]) => count >= majority)?.[0];
      if (winningOption) {
        await prisma.votes.update({ where: { id: voteId }, data: { status: 'CLOSED', closed_at: new Date() } });
        if (vote.type === 'START_SOLVING' && winningOption === 'yes') await prisma.rooms.update({ where: { id: roomId }, data: { status: 'SOLVING' } });
        io.to(roomId).emit('vote_closed', { voteId, optionId: winningOption, counts });
        await emitRoomState(roomId);
      } else if (responses.length >= (room?.players.length || 0)) {
        await prisma.votes.update({ where: { id: voteId }, data: { status: 'TIED', closed_at: new Date() } });
        const nextVote = await prisma.votes.create({ data: { room_id: roomId, type: vote.type, options: vote.options, status: 'OPEN' } });
        io.to(roomId).emit('vote_tied', { voteId, nextVote });
        io.to(roomId).emit('vote_started', nextVote);
      } else io.to(roomId).emit('vote_updated', { voteId, counts });
    } catch { socket.emit('room_error', 'Não foi possível registrar o voto.'); }
  });

  socket.on('pause_room', async ({ roomId, userId }) => {
    const room = await prisma.rooms.findUnique({ where: { id: roomId } });
    if (!room || room.host_user_id !== userId || !['IN_PROGRESS', 'SOLVING', 'REVEAL'].includes(room.status)) return;
    await prisma.rooms.update({ where: { id: roomId }, data: { status: 'PAUSED' } });
    io.to(roomId).emit('room_paused'); await emitRoomState(roomId); await recordRoomEvent(roomId, 'room_paused');
  });

  socket.on('resume_room', async ({ roomId, userId }) => {
    const room = await prisma.rooms.findUnique({ where: { id: roomId } });
    if (!room || room.host_user_id !== userId || room.status !== 'PAUSED') return;
    await prisma.rooms.update({ where: { id: roomId }, data: { status: 'IN_PROGRESS' } });
    io.to(roomId).emit('room_resumed'); await emitRoomState(roomId); await recordRoomEvent(roomId, 'room_resumed');
  });

  socket.on('submit_theory', async ({ roomId, userId, answers }) => {
    try {
      const room = await prisma.rooms.findUnique({
        where: { id: roomId },
        include: { players: true, case_version: true }
      });
      if (!room || room.status !== 'SOLVING') return;

      const player = room.players.find(p => p.anonymous_user_id === userId);
      if (!player) return;

      const priorEvaluation = await prisma.theory_evaluations.findFirst({ where: { room_id: roomId }, orderBy: { attempt_number: 'desc' } });
      const attemptNumber = priorEvaluation ? priorEvaluation.attempt_number + 1 : 1;
      const existingTheory = await prisma.theories.findFirst({ where: { room_id: roomId, player_id: player.id, attempt_number: attemptNumber } });
      if (existingTheory) return socket.emit('room_error', 'Sua teoria já foi enviada.');

      // Salvar a teoria
      await prisma.theories.create({
        data: {
          room_id: roomId,
          player_id: player.id,
          attempt_number: attemptNumber,
          answers: JSON.stringify(answers),
          status: 'SUBMITTED',
          submitted_at: new Date()
        }
      });

      // Verificar se todos enviaram
       const allTheories = await prisma.theories.findMany({ where: { room_id: roomId, attempt_number: attemptNumber } });
      
      if (allTheories.length >= room.players.length) {
        // Todos enviaram: revelar as teorias e abrir a votação oficial.
        await prisma.rooms.update({
          where: { id: roomId },
          data: { status: 'REVEAL' }
        });
        const selectionVote = await prisma.votes.create({ data: { room_id: roomId, type: 'THEORY_SELECTION', options: JSON.stringify(allTheories.map((theory) => {
          const p = room.players.find(pl => pl.id === theory.player_id);
          const name = p ? p.display_name : 'Desconhecido';
          return { id: theory.id, label: `Teoria de ${name}` };
        })), status: 'OPEN' } });
        io.to(roomId).emit('theories_revealed', { ready: true });
        io.to(roomId).emit('vote_started', selectionVote);
      }

       await emitRoomState(roomId);
    } catch (err) {
      console.error("Erro em submit_theory:", err);
    }
  });

  socket.on('finish_game', async ({ roomId, userId }) => {
    try {
      const room = await prisma.rooms.findUnique({
        where: { id: roomId },
        include: { players: true, case_version: true, theories: true }
      });
      if (!room || room.status !== 'REVEAL') return;

      // Restringir que só o host pode encerrar
      if (room.host_user_id !== userId) return;

      const openVote = await prisma.votes.findFirst({ where: { room_id: roomId, type: 'THEORY_SELECTION', status: 'OPEN' } });
      if (openVote) return socket.emit('room_error', 'A votação da equipe ainda está em andamento. Aguarde todos votarem.');

      const selectionVote = await prisma.votes.findFirst({ where: { room_id: roomId, type: 'THEORY_SELECTION', status: 'CLOSED' }, orderBy: { closed_at: 'desc' }, include: { responses: true } });
      const selectedTheoryId = selectionVote?.responses.reduce<Record<string, number>>((all, response) => ({ ...all, [response.option_id]: (all[response.option_id] || 0) + 1 }), {});
      const selectedId = selectedTheoryId ? Object.entries(selectedTheoryId).sort((a, b) => b[1] - a[1])[0]?.[0] : undefined;
      if (!selectedId) return socket.emit('room_error', 'Erro ao determinar a teoria vencedora.');
      const trueSolution = revealSecret(room.case_version.full_solution_encrypted);
      
      const evaluations = await Promise.all(
        room.theories.filter((theory) => theory.id === selectedId).map(async (t) => {
          const answers = JSON.parse(t.answers);
          const evaluation = await evaluateTheory(answers, trueSolution);
          
          await prisma.theories.update({
            where: { id: t.id },
            data: { status: 'EVALUATED' }
          });
          await prisma.theory_evaluations.create({ data: { theory_id: t.id, room_id: roomId, attempt_number: t.attempt_number, result: evaluation.score >= 75 ? 'CORRECT' : evaluation.score >= 40 ? 'PARTIAL' : 'INCORRECT', dimension_results: JSON.stringify(evaluation.dimensionResults || {}), feedback: evaluation.feedback, score_delta: evaluation.score } });

          return {
            playerId: t.player_id,
            score: evaluation.score,
            feedback: evaluation.feedback
          };
        })
      );

      // Calcular o Score do Grupo baseado na média das teorias
      const groupScore = evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length;

      const selectedTheory = room.theories.find((theory) => theory.id === selectedId);
      if (selectedTheory && selectedTheory.attempt_number < 2 && groupScore < 75) {
        await prisma.rooms.update({ where: { id: roomId }, data: { status: 'IN_PROGRESS' } });
        io.to(roomId).emit('theory_evaluation', { evaluations, groupScore, canRetry: true, message: 'A equipe pode continuar investigando e tentar novamente.' });
        await emitRoomState(roomId);
        return;
      }

      await prisma.rooms.update({
        where: { id: roomId },
        data: { status: 'GAME_OVER' }
      });

      const [questionCount, repeatedQuestionCount, hintsUsed] = await Promise.all([
        prisma.questions.count({ where: { room_id: roomId } }),
        prisma.questions.count({ where: { room_id: roomId, repeated_question_id: { not: null } } }),
        prisma.hint_usages.count({ where: { room_id: roomId } })
      ]);

      await prisma.game_results.upsert({
        where: { room_id: roomId },
        update: { status: 'COMPLETED', score: Math.round(groupScore), title: 'Caso encerrado', duration_seconds: Math.round((Date.now() - room.created_at.getTime()) / 1000), question_count: questionCount, repeated_question_count: repeatedQuestionCount, hints_used: hintsUsed, attempts: selectedTheory?.attempt_number || 1 },
        create: { room_id: roomId, status: 'COMPLETED', score: Math.round(groupScore), title: 'Caso encerrado', duration_seconds: Math.round((Date.now() - room.created_at.getTime()) / 1000), question_count: questionCount, repeated_question_count: repeatedQuestionCount, hints_used: hintsUsed, attempts: selectedTheory?.attempt_number || 1 }
      });

      io.to(roomId).emit('game_over', { evaluations, groupScore, solution: { text: trueSolution } });
      
      await emitRoomState(roomId);
      
    } catch (err) {
      console.error("Erro em finish_game:", err);
    }
  });

  socket.on('disconnect', () => {
    const { roomId, userId } = socket.data as { roomId?: string; userId?: string };
    if (roomId && userId) {
      recordAnalytics('player_disconnected', roomId, userId).catch(() => undefined);
      // Aguarda 5s antes de marcar como desconectado para evitar race conditions em reconexões rápidas
      setTimeout(async () => {
        try {
          // Só marca como DISCONNECTED se o jogador ainda não reconectou
          const player = await prisma.room_players.findFirst({ where: { room_id: roomId, anonymous_user_id: userId } });
          if (!player || player.connection_status === 'CONNECTED') return;
          await prisma.room_players.updateMany({ where: { room_id: roomId, anonymous_user_id: userId }, data: { connection_status: 'DISCONNECTED', last_seen_at: new Date() } });
          const current = await prisma.rooms.findUnique({ where: { id: roomId }, include: { players: true } });
          if (!current || current.host_user_id !== userId || ['GAME_OVER', 'COMPLETED'].includes(current.status)) return;
          const hostPlayer = current.players.find((p) => p.anonymous_user_id === userId);
          if (hostPlayer?.connection_status === 'CONNECTED') return;
          const successor = current.players.find((player) => player.anonymous_user_id !== userId && player.connection_status === 'CONNECTED');
          if (successor) {
            await prisma.$transaction([prisma.rooms.update({ where: { id: roomId }, data: { host_user_id: successor.anonymous_user_id } }), prisma.room_players.updateMany({ where: { room_id: roomId, is_host: true }, data: { is_host: false } }), prisma.room_players.update({ where: { id: successor.id }, data: { is_host: true } })]);
            io.to(roomId).emit('host_transferred', { playerId: successor.id });
          }
          await emitRoomState(roomId);
        } catch (err) {
          console.error("Erro no disconnect handler:", err);
        }
      }, 5000);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
