const originalText = new WeakMap<Text, string>();
const originalAttrs = new WeakMap<Element, Record<string, string>>();

let observer: MutationObserver | null = null;
let applying = false;

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
  'Buscar amigo': 'Search friend',
  'Cancelar': 'Cancel',
  'Carregando página...': 'Loading page...',
  'Carregando rede': 'Loading network',
  'Casos': 'Cases',
  'CASOS': 'CASES',
  'Casos disponíveis': 'Available cases',
  'Como funciona': 'How it works',
  'Configurações': 'Settings',
  'CONFIGURAÇÕES': 'SETTINGS',
  'Conta': 'Account',
  'Conta sincronizada com seu progresso': 'Account synced with your progress',
  'Convite rápido': 'Quick invite',
  'Convites de amigos': 'Friend invites',
  'Convites pendentes': 'pending invites',
  'Copiado.': 'Copied.',
  'Criar conta': 'Create account',
  'Digite um alias.': 'Enter an alias.',
  'Digite um nome, @usuário ou e-mail para adicionar alguém à sua rede.': 'Enter a name, @alias or email to add someone to your network.',
  'Efeitos sonoros': 'Sound effects',
  'English': 'English',
  'Entrar': 'Sign in',
  'Escolha sua próxima': 'Choose your next one',
  'Esse alias já está em uso.': 'This alias is already taken.',
  'Escuro': 'Dark',
  'Idioma': 'Language',
  'Início': 'Home',
  'INÍCIO': 'HOME',
  'Investigadores': 'Investigators',
  'Marcas de campo': 'Field marks',
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
  'Tema': 'Theme',
  'Termos de uso': 'Terms of use',
  'Use apenas letras, números e underline.': 'Use only letters, numbers and underscore.',
  'Use letras, números e underline.': 'Use letters, numbers and underscore.',
  'Use no máximo 24 caracteres.': 'Use up to 24 characters.',
  'Use pelo menos 3 caracteres.': 'Use at least 3 characters.',
  'Verificando alias...': 'Checking alias...',
  'Versão do jogo': 'Game version',
  'Voz dos personagens': 'Character voices',
  'Você será desconectado desta conta neste dispositivo.': 'You will be signed out of this account on this device.',
};

const translatableAttrs = ['placeholder', 'aria-label', 'title'];
const skipTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const translateValue = (value: string) => translations[normalize(value)] || value;

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
    if (skipTags.has(element.tagName)) return;
    if (language === 'pt-BR') restoreAttrs(element);
    else translateElementAttrs(element);
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
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
};
