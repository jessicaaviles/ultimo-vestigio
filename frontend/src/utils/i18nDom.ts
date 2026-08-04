const originalText = new WeakMap<Text, string>();
const originalAttrs = new WeakMap<Element, Record<string, string>>();

let observer: MutationObserver | null = null;
let applying = false;
let refreshTimers: number[] = [];

const translations: Record<string, string> = {
  'Acessar': 'Sign in',
  'Adicionar': 'Add',
  'Adicionar amigo': 'Add friend',
  'Aguarde': 'Please wait',
  'Ajuda e suporte': 'Help and support',
  'Ajuste o jogo do seu jeito.': 'Adjust the game your way.',
  'Alto contraste': 'High contrast',
  'Alias atual.': 'Current alias.',
  'Alias disponível.': 'Alias available.',
  'Alias indisponível.': 'Alias unavailable.',
  'Alias público': 'Public alias',
  'Amigos': 'Friends',
  'Arquivo do investigador': 'Investigator file',
  'ARQUIVO MUNICIPAL': 'MUNICIPAL ARCHIVE',
  'Áudio': 'Audio',
  'Automático': 'Automatic',
  'Bronze': 'Bronze',
  'BRONZE': 'BRONZE',
  'Buscar amigo': 'Search friend',
  'Cancelar': 'Cancel',
  'Carregando investigação em destaque': 'Loading featured investigation',
  'Carregando página...': 'Loading page...',
  'Carregando rede': 'Loading network',
  'Casos com diferentes ritmos, cenários e níveis de desafio.': 'Cases with different rhythms, settings and challenge levels.',
  'Casos': 'Cases',
  'CASOS': 'CASES',
  'Casos disponíveis': 'Available cases',
  'CASOS DISPONÍVEIS': 'AVAILABLE CASES',
  'Caso em andamento': 'Active case',
  'CASO EM ANDAMENTO': 'ACTIVE CASE',
  'Caso em destaque': 'Featured case',
  'CASO EM DESTAQUE': 'FEATURED CASE',
  'Caso Oficial': 'Official case',
  'CASO OFICIAL': 'OFFICIAL CASE',
  'Caso Rápido': 'Quick case',
  'CASO RÁPIDO': 'QUICK CASE',
  'Caso Tutorial': 'Tutorial case',
  'CASO TUTORIAL': 'TUTORIAL CASE',
  'Cerca de 30 min': 'About 30 min',
  'Conquistada': 'Unlocked',
  'CONQUISTADA': 'UNLOCKED',
  'Conquistas': 'Achievements',
  'CANAL SEGURO': 'SECURE CHANNEL',
  'Como funciona': 'How it works',
  'Configurações': 'Settings',
  'CONFIGURAÇÕES': 'SETTINGS',
  'Conta': 'Account',
  'Conta sincronizada': 'Account synced',
  'Conta sincronizada com seu progresso': 'Account synced with your progress',
  'Conclua uma investigação para registrar sua precisão, tempo em campo e subir de patente na agência.': 'Complete an investigation to record your accuracy, time in the field and rise through the agency ranks.',
  'Comunicações': 'Communications',
  'Complete sua primeira investigação.': 'Complete your first investigation.',
  'Convite rápido': 'Quick invite',
  'Convites de amigos': 'Friend invites',
  'Convites pendentes': 'pending invites',
  'Copiado.': 'Copied.',
  'Criar conta': 'Create account',
  'Digite um alias.': 'Enter an alias.',
  'Digite um nome, @usuário ou e-mail para adicionar alguém à sua rede.': 'Enter a name, @alias or email to add someone to your network.',
  'Define o idioma usado na leitura das respostas.': 'Sets the language used when reading responses aloud.',
  'Efeitos sonoros': 'Sound effects',
  'English': 'English',
  'Entrar': 'Sign in',
  'Editar perfil': 'Edit profile',
  'Escolha sua próxima': 'Choose your next one',
  'Escolha sua próxima investigação': 'Choose your next investigation',
  'Escolher caso': 'Choose case',
  'Esse alias já está em uso.': 'This alias is already taken.',
  'Escuro': 'Dark',
  'Fale com outros membros da equipe ou com o Mestre Investigador.': 'Talk to other team members or to the Investigator Master.',
  'Fácil': 'Easy',
  'Field marks': 'Field marks',
  'Explorar casos': 'Explore cases',
  'Idioma': 'Language',
  'Idioma da voz do Mestre': "Master's voice language",
  'Início': 'Home',
  'INÍCIO': 'HOME',
  'Investigações jogadas': 'Investigations played',
  'INVESTIGAÇÕES JOGADAS': 'INVESTIGATIONS PLAYED',
  'Investigadores': 'Investigators',
  'Investigação': 'Investigation',
  'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell. Analise todas as evidências e encontre a verdade.': "Investigate Clara Mendes' mysterious disappearance at the Blackwell family mansion. Analyze every piece of evidence and uncover the truth.",
  'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell.': "Investigate Clara Mendes' mysterious disappearance at the Blackwell family mansion.",
  'Investigador consistente': 'Consistent investigator',
  'Investigadores Conectados': 'Connected investigators',
  'INVESTIGATOR FILE': 'INVESTIGATOR FILE',
  'Jornada concluída': 'Journey completed',
  'JORNADA CONCLUÍDA': 'JOURNEY COMPLETED',
  'Jogar esse caso': 'Play this case',
  'Mansão Blackwell': 'Blackwell Mansion',
  'Marcas de campo': 'Field marks',
  'MARCA DE CAMPO': 'FIELD MARK',
  'MARCAS DE CAMPO': 'FIELD MARKS',
  'Média': 'Medium',
  'Médio': 'Medium',
  'Mensagens': 'Messages',
  'MENSAGENS': 'MESSAGES',
  'Meu perfil': 'My profile',
  'Muito fácil': 'Very easy',
  'MUITO FÁCIL': 'VERY EASY',
  'Música': 'Music',
  'Nenhuma conversa disponível': 'No conversations available',
  'Nenhum investigador encontrado': 'No investigator found',
  'Nenhum caso disponível no momento.': 'No cases available right now.',
  'Nome de investigador': 'Investigator name',
  'Notificações': 'Notifications',
  'Notificações push': 'Push notifications',
  'Novidades e atualizações': 'News and updates',
  'Novo investigador': 'New investigator',
  'Perfil': 'Profile',
  'PERFIL': 'PROFILE',
  'Perfil ativo para a equipe': 'Profile active for the team',
  'Precisão das teorias': 'Theory accuracy',
  'PRECISÃO DAS TEORIAS': 'THEORY ACCURACY',
  'Personalize sua experiência': 'Personalize your experience',
  'Política de privacidade': 'Privacy policy',
  'Português (Brasil)': 'Portuguese (Brazil)',
  'Preferências': 'Preferences',
  'Prata': 'Silver',
  'PRATA': 'SILVER',
  'Primeiro caso': 'First case',
  'Resumo semanal': 'Weekly summary',
  'Restaurar': 'Restore',
  'Restaurar configurações padrão': 'Restore default settings',
  'Restaurar configurações?': 'Restore settings?',
  'Salvar perfil': 'Save profile',
  'Salvando…': 'Saving...',
  'Salas': 'Rooms',
  'SALAS': 'ROOMS',
  'Sair': 'Sign out',
  'Sair da conta': 'Sign out',
  'Sair da conta?': 'Sign out?',
  'Sobre': 'About',
  'Sua rede': 'Your network',
  'Sua Sala': 'Your room',
  'Suas estatísticas': 'Your statistics',
  'SUAS ESTATÍSTICAS': 'YOUR STATISTICS',
  'Seu histórico não pôde ser consultado agora.': 'Your history could not be checked right now.',
  'Seu primeiro caso espera por você': 'Your first case is waiting for you',
  'Sem dados': 'No data',
  'Sem teorias': 'No theories',
  'Sinopse não disponível.': 'Synopsis unavailable.',
  'Selecione uma investigação ativa para iniciar ou configurar uma sala multiplayer.': 'Select an active investigation to start or set up a multiplayer room.',
  'Tema': 'Theme',
  'Termos de uso': 'Terms of use',
  'Teorias registradas': 'Theories submitted',
  'TEORIAS REGISTRADAS': 'THEORIES SUBMITTED',
  'Tentar novamente': 'Try again',
  'O Guarda-chuva Molhado': 'The Wet Umbrella',
  'O Presente Desaparecido': 'The Missing Gift',
  'O Quarto 7': 'Room 7',
  'O Elevador que Não Parou': 'The Elevator That Did Not Stop',
  'A Mensagem das 23h17': 'The 23:17 Message',
  'O Retrato que Piscou': 'The Portrait That Blinked',
  'O Jardim Sem Pegadas': 'The Garden Without Footprints',
  'A Herança de Vidro': 'The Glass Inheritance',
  'O Segredo de Blackwell House': 'The Secret of Blackwell House',
  'Uma pessoa entra em uma sala vazia e encontra um guarda-chuva completamente molhado. O céu está limpo.': 'A person enters an empty room and finds a completely wet umbrella. The sky is clear.',
  'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos. Ninguém saiu do ambiente.': 'During a family celebration, the gift box on the table disappears in front of everyone. Nobody left the room.',
  'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper após ameaçar revelar um escândalo antigo. Uma chave mestra, uma câmera reposicionada e um relógio quebrado escondem o verdadeiro motivo.': 'Helena Duarte was found unconscious in Room 7 of Hotel Vesper after threatening to reveal an old scandal. A master key, a repositioned camera and a broken clock hide the real motive.',
  'Uma mulher entra sozinha em um elevador, mas quando ele retorna ao térreo, está vazio.': 'A woman enters an elevator alone, but when it returns to the ground floor, it is empty.',
  'Às 23h17, uma mensagem é enviada do celular de uma pessoa desaparecida enquanto o aparelho estava no carregador.': 'At 23:17, a message is sent from a missing person’s phone while the device was charging.',
  'Todos veem o retrato piscar e uma joia desaparece. A pintura não possui mecanismos.': 'Everyone sees the portrait blink and a jewel disappears. The painting has no mechanisms.',
  'Uma escultora desaparece de um jardim encharcado sem deixar pegadas. No centro do labirinto, apenas uma tesoura de poda e uma estátua recém-lavada.': 'A sculptor disappears from a soaked garden without leaving footprints. At the center of the maze, only pruning shears and a freshly washed statue remain.',
  'Uma restauradora morre dentro de um conservatório trancado na noite em que mudaria o testamento da família. O vidro quebrado aponta para fora, mas a verdade veio de dentro.': 'A restorer dies inside a locked conservatory on the night she planned to change the family will. The broken glass points outward, but the truth came from within.',
  'As conversas aparecerão aqui quando uma sala ou investigação criar um canal de comunicação.': 'Conversations will appear here when a room or investigation creates a communication channel.',
  'Participe de 5 investigações.': 'Join 5 investigations.',
  'Criação de sala': 'Room creation',
  'Crie uma sala concluída.': 'Create a completed room.',
  'Teoria em campo': 'Theory in the field',
  'Registre sua primeira teoria.': 'Submit your first theory.',
  'Dedução correta': 'Correct deduction',
  'Acerte uma teoria final.': 'Get a final theory right.',
  'Precisão de elite': 'Elite accuracy',
  'Alcance 80% de precisão com 3 teorias.': 'Reach 80% accuracy with 3 theories.',
  'Use apenas letras, números e underline.': 'Use only letters, numbers and underscore.',
  'Use letras, números e underline.': 'Use letters, numbers and underscore.',
  'Use no máximo 24 caracteres.': 'Use up to 24 characters.',
  'Use pelo menos 3 caracteres.': 'Use at least 3 characters.',
  'Verificando alias...': 'Checking alias...',
  'Ver todos': 'View all',
  'Voltar para a sala': 'Return to room',
  'Versão do jogo': 'Game version',
  'Voz dos personagens': 'Character voices',
  'Você será desconectado desta conta neste dispositivo.': 'You will be signed out of this account on this device.',
  'Você já resolveu todos os casos disponíveis. Novas investigações aparecerão aqui.': 'You have solved every available case. New investigations will appear here.',
  'acertos': 'correct',
  'desbloqueadas': 'unlocked',
  'jogador': 'player',
  'jogadores': 'players',
  'investigador': 'investigator',
  'investigadores': 'investigators',
  'marcos': 'milestones',
  'sessões': 'sessions',
  'teorias': 'theories',
};

const regexTranslations: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Dificuldade (.+)$/i, (match) => `Difficulty ${translateValue(match[1]).toLocaleLowerCase('en')}`],
  [/^Tensão:\s*(.+)$/i, (match) => `Tension: ${match[1]}`],
  [/^(\d+)\s+a\s+(\d+)\s+investigadores$/i, (match) => `${match[1]} to ${match[2]} investigators`],
  [/^(\d+)\s+a\s+(\d+)\s+jogadores$/i, (match) => `${match[1]} to ${match[2]} players`],
  [/^(\d+)\/(\d+)\s+gerações$/i, (match) => `${match[1]}/${match[2]} generations`],
  [/^(\d+)-(\d+)\s+jogadores$/i, (match) => `${match[1]}-${match[2]} players`],
  [/^(\d+)\s+\/\s+(\d+)\s+marcos$/i, (match) => `${match[1]} / ${match[2]} milestones`],
  [/^(\d+)\s+\/\s+(\d+)\s+sessões$/i, (match) => `${match[1]} / ${match[2]} sessions`],
  [/^(\d+)\s+\/\s+(\d+)\s+teorias$/i, (match) => `${match[1]} / ${match[2]} theories`],
  [/^(\d+)\s+acertos$/i, (match) => `${match[1]} correct`],
  [/^Investigadores Conectados\s+\((\d+)\)$/i, (match) => `Connected investigators (${match[1]})`],
];

const translatableAttrs = ['placeholder', 'aria-label', 'title'];
const skipTextTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
const skipAttrTags = new Set(['SCRIPT', 'STYLE']);

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const translateValue = (value: string) => {
  const normalized = normalize(value);
  const exact = translations[normalized];
  if (exact) return exact;
  for (const [pattern, translate] of regexTranslations) {
    const match = normalized.match(pattern);
    if (match) return translate(match);
  }
  return value;
};

const restoreAttrs = (element: Element) => {
  const attrs = originalAttrs.get(element);
  if (!attrs) return;
  Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
};

const translateElementAttrs = (element: Element) => {
  let originals = originalAttrs.get(element);
  translatableAttrs.forEach((attr) => {
    const value = element.getAttribute(attr);
    if (!value) return;
    const translated = translateValue(value);
    if (translated === value) return;
    if (!originals) {
      originals = {};
      originalAttrs.set(element, originals);
    }
    if (!originals[attr]) originals[attr] = value;
    element.setAttribute(attr, translated);
  });
};

const translateTextNode = (node: Text) => {
  const source = originalText.get(node) || node.nodeValue || '';
  const translated = translateValue(source);
  if (translated === source) return;
  if (!originalText.has(node)) originalText.set(node, source);
  const leading = source.match(/^\s*/)?.[0] || '';
  const trailing = source.match(/\s*$/)?.[0] || '';
  node.nodeValue = `${leading}${translated}${trailing}`;
};

const walk = (root: ParentNode, language: 'pt-BR' | 'en') => {
  if (root.nodeType === Node.TEXT_NODE) {
    const textNode = root as unknown as Text;
    if (language === 'pt-BR') {
      const source = originalText.get(textNode);
      if (source !== undefined) textNode.nodeValue = source;
    } else {
      translateTextNode(textNode);
    }
    return;
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : Array.from(root.querySelectorAll('*'));

  elements.forEach((element) => {
    if (skipAttrTags.has(element.tagName)) return;
    if (language === 'pt-BR') restoreAttrs(element);
    else translateElementAttrs(element);
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || skipTextTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return normalize(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    if (language === 'pt-BR') {
      const source = originalText.get(node);
      if (source !== undefined) node.nodeValue = source;
      return;
    }
    translateTextNode(node);
  });
};

export const applyDocumentLanguage = (selectedLanguage: string) => {
  if (typeof document === 'undefined' || !document.body) return;
  const language = selectedLanguage === 'English' ? 'en' : 'pt-BR';
  refreshTimers.forEach((timer) => window.clearTimeout(timer));
  refreshTimers = [];

  observer?.disconnect();
  applying = true;
  walk(document.body, language);
  applying = false;

  observer = new MutationObserver((mutations) => {
    if (applying) return;
    applying = true;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
          walk(node as ParentNode, language);
        }
      });
    });
    applying = false;
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  refreshTimers = [150, 600, 1200].map((delay) => window.setTimeout(() => {
    if (!document.body) return;
    applying = true;
    walk(document.body, language);
    applying = false;
  }, delay));
};
