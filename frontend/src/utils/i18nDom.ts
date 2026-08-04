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
  'Áudio': 'Audio',
  'Automático': 'Automatic',
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
  'Cerca de 30 min': 'About 30 min',
  'Como funciona': 'How it works',
  'Configurações': 'Settings',
  'CONFIGURAÇÕES': 'SETTINGS',
  'Conta': 'Account',
  'Conta sincronizada': 'Account synced',
  'Conta sincronizada com seu progresso': 'Account synced with your progress',
  'Conclua uma investigação para registrar sua precisão, tempo em campo e subir de patente na agência.': 'Complete an investigation to record your accuracy, time in the field and rise through the agency ranks.',
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
  'Escolha sua próxima': 'Choose your next one',
  'Escolha sua próxima investigação': 'Choose your next investigation',
  'Escolher caso': 'Choose case',
  'Esse alias já está em uso.': 'This alias is already taken.',
  'Escuro': 'Dark',
  'Explorar casos': 'Explore cases',
  'Idioma': 'Language',
  'Idioma da voz do Mestre': "Master's voice language",
  'Início': 'Home',
  'INÍCIO': 'HOME',
  'Investigações jogadas': 'Investigations played',
  'INVESTIGAÇÕES JOGADAS': 'INVESTIGATIONS PLAYED',
  'Investigadores': 'Investigators',
  'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell.': "Investigate Clara Mendes' mysterious disappearance at the Blackwell family mansion.",
  'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell. Analise todas as evidências e encontre a verdade.': "Investigate Clara Mendes' mysterious disappearance at the Blackwell family mansion. Analyze every piece of evidence and uncover the truth.",
  'Jogar esse caso': 'Play this case',
  'Marcas de campo': 'Field marks',
  'Média': 'Medium',
  'Mensagens': 'Messages',
  'MENSAGENS': 'MESSAGES',
  'Meu perfil': 'My profile',
  'Música': 'Music',
  'Nenhum investigador encontrado': 'No investigator found',
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
  'Suas estatísticas': 'Your statistics',
  'SUAS ESTATÍSTICAS': 'YOUR STATISTICS',
  'Seu histórico não pôde ser consultado agora.': 'Your history could not be checked right now.',
  'Seu primeiro caso espera por você': 'Your first case is waiting for you',
  'Sem dados': 'No data',
  'Sem teorias': 'No theories',
  'Sinopse não disponível.': 'Synopsis unavailable.',
  'Tema': 'Theme',
  'Termos de uso': 'Terms of use',
  'Teorias registradas': 'Theories submitted',
  'TEORIAS REGISTRADAS': 'THEORIES SUBMITTED',
  'Tentar novamente': 'Try again',
  'Use apenas letras, números e underline.': 'Use only letters, numbers and underscore.',
  'Use letras, números e underline.': 'Use letters, numbers and underscore.',
  'Use no máximo 24 caracteres.': 'Use up to 24 characters.',
  'Use pelo menos 3 caracteres.': 'Use at least 3 characters.',
  'Verificando alias...': 'Checking alias...',
  'Ver todos': 'View all',
  'Versão do jogo': 'Game version',
  'Voz dos personagens': 'Character voices',
  'Você será desconectado desta conta neste dispositivo.': 'You will be signed out of this account on this device.',
  'Você já resolveu todos os casos disponíveis. Novas investigações aparecerão aqui.': 'You have solved every available case. New investigations will appear here.',
  'acertos': 'correct',
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
  [/^(\d+)\s+a\s+(\d+)\s+investigadores$/i, (match) => `${match[1]} to ${match[2]} investigators`],
  [/^(\d+)\s+a\s+(\d+)\s+jogadores$/i, (match) => `${match[1]} to ${match[2]} players`],
  [/^(\d+)-(\d+)\s+jogadores$/i, (match) => `${match[1]}-${match[2]} players`],
  [/^(\d+)\s+\/\s+(\d+)\s+marcos$/i, (match) => `${match[1]} / ${match[2]} milestones`],
  [/^(\d+)\s+\/\s+(\d+)\s+sessões$/i, (match) => `${match[1]} / ${match[2]} sessions`],
  [/^(\d+)\s+\/\s+(\d+)\s+teorias$/i, (match) => `${match[1]} / ${match[2]} theories`],
  [/^(\d+)\s+acertos$/i, (match) => `${match[1]} correct`],
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
