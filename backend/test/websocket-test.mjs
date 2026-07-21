import http from 'http';
import { io } from 'socket.io-client';

const BASE_HTTP = 'http://localhost:3001';
const BASE_WS = 'http://localhost:3001';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_HTTP);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testWebSocket() {
  console.log('=== INICIANDO VALIDAÇÃO DE WEBSOCKETS ===\n');

  // 1. Criar Jogadores no banco via HTTP
  console.log('1. Criando Jogador A (Host)...');
  const userA = await request('POST', '/api/anonymous-users', {});
  console.log('   User A Response:', JSON.stringify(userA));
  const userIdA = userA?.data?.userId;
  console.log(`   Jogador A criado. ID: ${userIdA}`);

  console.log('2. Criando Jogador B (Convidado)...');
  const userB = await request('POST', '/api/anonymous-users', {});
  console.log('   User B Response:', JSON.stringify(userB));
  const userIdB = userB?.data?.userId;
  console.log(`   Jogador B criado. ID: ${userIdB}`);

  if (!userIdA || !userIdB) {
    console.error('Erro: Não foi possível criar os usuários.');
    process.exit(1);
  }

  // Atualizar perfis
  await request('PUT', `/api/profiles/${userIdA}`, { displayName: 'Host Clara' });
  await request('PUT', `/api/profiles/${userIdB}`, { displayName: 'Convidado Tomas' });

  // 2. Criar uma sala pelo Jogador A
  console.log('3. Listando casos disponíveis...');
  const casesRes = await request('GET', '/api/cases', {});
  const caseSlug = casesRes?.data?.[0]?.slug || 'o-guarda-chuva-molhado';
  console.log(`   Usando o caso: ${caseSlug}`);

  console.log('4. Criando sala...');
  const roomRes = await request('POST', '/api/rooms', {
    caseId: caseSlug,
    hostUserId: userIdA,
    hostDisplayName: 'Host Clara',
    settings: { turn_timer_seconds: 60 }
  });

  const roomId = roomRes?.roomId;
  const publicCode = roomRes?.publicCode;
  console.log(`   Sala criada. ID: ${roomId}, Código Público: ${publicCode}`);

  if (!roomId) {
    console.error('Erro: Não foi possível criar a sala.');
    process.exit(1);
  }

  // 3. Fazer Jogador B entrar na sala via HTTP
  console.log('5. Fazendo Jogador B entrar na sala...');
  const joinRes = await request('POST', '/api/rooms/join', {
    publicCode,
    userId: userIdB,
    displayName: 'Convidado Tomas'
  });
  console.log(`   Jogador B entrou na sala via HTTP: ${joinRes.success ? 'SUCESSO' : 'FALHA'}`);

  // 4. Conectar via WebSockets
  console.log('\n6. Estabelecendo conexão WebSocket para ambos os jogadores...');
  const socketA = io(BASE_WS, { reconnection: true });
  const socketB = io(BASE_WS, { reconnection: true });

  let hostStateUpdatedCount = 0;
  let guestStateUpdatedCount = 0;
  let typingReceived = false;

  // Registrar listeners
  socketA.on('connect', () => {
    console.log('   [WS A] Conectado.');
    socketA.emit('join_room', { roomId, userId: userIdA });
  });

  socketB.on('connect', () => {
    console.log('   [WS B] Conectado.');
    socketB.emit('join_room', { roomId, userId: userIdB });
  });

  socketA.on('room_state_updated', (state) => {
    hostStateUpdatedCount++;
    console.log(`   [WS A] Estado da sala atualizado recebido. Total de players: ${state.players.length}`);
  });

  socketB.on('room_state_updated', (state) => {
    guestStateUpdatedCount++;
    console.log(`   [WS B] Estado da sala atualizado recebido. Total de players: ${state.players.length}`);
  });

  socketB.on('player_typing', ({ userId, typing }) => {
    if (userId === userIdA && typing === true) {
      typingReceived = true;
      console.log(`   [WS B] OK! Recebeu que o Jogador A está digitando...`);
    }
  });

  // Aguardar conexões e propagação inicial
  await delay(2000);

  // 5. Testar evento de digitação (Realtime broadcast)
  console.log('\n7. Testando propagação de evento de digitação...');
  socketA.emit('typing', { roomId, userId: userIdA, typing: true });

  await delay(1500);

  // 6. Testar alteração de status de pronto
  console.log('\n8. Testando alteração de status para READY...');
  socketB.emit('player_ready', { roomId, userId: userIdB, ready: true });

  await delay(1500);

  // Finalizar conexões
  console.log('\n9. Fechando conexões e exibindo resultados...');
  socketA.close();
  socketB.close();

  console.log('\n=== RESULTADO DA VALIDAÇÃO ===');
  console.log(`- Atualizações de estado recebidas por A (Host): ${hostStateUpdatedCount}`);
  console.log(`- Atualizações de estado recebidas por B (Guest): ${guestStateUpdatedCount}`);
  console.log(`- Evento de digitação recebido com sucesso: ${typingReceived ? 'SIM' : 'NÃO'}`);

  if (hostStateUpdatedCount > 0 && guestStateUpdatedCount > 0 && typingReceived) {
    console.log('\n✓ VALIDAÇÃO BEM-SUCEDIDA! O tempo real está funcionando perfeitamente.');
    process.exit(0);
  } else {
    console.error('\n✗ VALIDAÇÃO FALHOU: Algumas mensagens ou eventos não foram transmitidos.');
    process.exit(1);
  }
}

testWebSocket().catch(err => {
  console.error('Erro durante o teste:', err);
  process.exit(1);
});
