import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { SettingsState } from '../contexts/settingsTypes';

const MALE_VOICE_HINTS_BY_PLATFORM: Record<string, string[]> = {
  web: ['Felipe', 'Bruno', 'Lucas', 'Mateus', 'Matheus', 'Rafael', 'Ricardo', 'Rodrigo', 'Paulo', 'João', 'Joao', 'Daniel', 'Thiago', 'Marcos', 'André', 'Andre', 'Gustavo', 'Leandro', 'Fernando', 'Hugo', 'Diego', 'Caio', 'Samuel', 'Victor', 'Vitor', 'Google US English', 'Microsoft David', 'Alex', 'Daniel'],
  ios: ['Felipe', 'Google', 'João', 'Joao', 'Siri', 'Alex', 'Daniel'],
  android: ['Felipe', 'Google', 'João', 'Joao', 'Samsung', 'Google US English'],
  default: ['Felipe', 'Google', 'João', 'Joao', 'Alex', 'Daniel'],
};

const isBrowser = typeof window !== 'undefined';

const getPlatformKey = () => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android' || platform === 'web') return platform;
  return 'default';
};

const getLanguage = (settings: SettingsState) => {
  if (settings.voiceLanguage === 'English') return 'en-US';
  if (settings.voiceLanguage === 'Português (Brasil)') return 'pt-BR';
  return settings.language === 'English' ? 'en-US' : 'pt-BR';
};

const normalizeMasterTone = (text: string) => text
  .replace(/\s+/g, ' ')
  .replace(/\s*-\s*/g, ', ')
  .replace(/\s*:\s*/g, ', ')
  .replace(/\.\s+/g, '. ')
  .trim();

const splitSpeechChunks = (text: string) => {
  const cleaned = normalizeMasterTone(text);
  const rawParts = cleaned
    .split(/(?<=[.!?;])\s+|(?:\s*[,;:]\s*)/g)
    .map(part => part.trim())
    .filter(Boolean);

  if (rawParts.length <= 1) return [cleaned];

  const chunks: string[] = [];
  let current = '';

  for (const part of rawParts) {
    const next = current ? `${current} ${part}` : part;
    if (next.length > 110 && current) {
      chunks.push(current.trim());
      current = part;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [cleaned];
};

const buildSpeechStyle = (text: string) => {
  const length = text.trim().length;
  if (length < 70) {
    return { rate: 0.94, pitch: 0.86, volume: 0.96 };
  }
  if (length < 160) {
    return { rate: 0.9, pitch: 0.83, volume: 0.95 };
  }
  return { rate: 0.87, pitch: 0.8, volume: 0.94 };
};

export const pickPreferredVoice = (voices: SpeechSynthesisVoice[], language: string) => {
  const platformKey = getPlatformKey();
  const hints = MALE_VOICE_HINTS_BY_PLATFORM[platformKey] || MALE_VOICE_HINTS_BY_PLATFORM.default;
  const lowerHints = hints.map(hint => hint.toLowerCase());
  const languagePrefix = language.split('-')[0].toLowerCase();
  const matchingVoices = voices.filter(v => v.lang?.toLowerCase().startsWith(languagePrefix));

  const byMaleHint = matchingVoices.find(v => lowerHints.some(hint => v.name.toLowerCase().includes(hint)));

  return byMaleHint
    || (matchingVoices as Array<SpeechSynthesisVoice & { gender?: string }>).find(v => String(v.gender || '').toLowerCase() === 'male')
    || matchingVoices.find(v => v.lang?.toLowerCase() === language.toLowerCase())
    || matchingVoices[0]
    || voices.find(v => v.lang?.toLowerCase().startsWith(languagePrefix))
    || voices[0]
    || null;
};

export const stopMasterVoice = () => {
  if (Capacitor.isNativePlatform()) {
    void TextToSpeech.stop();
  }
  if (isBrowser && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const speakWithWebSpeech = async (chunks: string[], settings: SettingsState) => {
  if (!isBrowser || !window.speechSynthesis) return;

  stopMasterVoice();

  const voices = window.speechSynthesis.getVoices();
  const language = getLanguage(settings);
  const preferredVoice = pickPreferredVoice(voices, language);
  const style = buildSpeechStyle(chunks.join(' '));

  for (const chunk of chunks) {
    await new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = language;
      utterance.rate = style.rate;
      utterance.pitch = style.pitch;
      utterance.volume = style.volume;
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onend = () => resolve();
      utterance.onerror = event => reject(event);
      window.speechSynthesis.speak(utterance);
    });
    await new Promise(resolve => window.setTimeout(resolve, 90));
  }
};

const speakWithNativeTts = async (chunks: string[], settings: SettingsState) => {
  const style = buildSpeechStyle(chunks.join(' '));
  const language = getLanguage(settings);
  for (const chunk of chunks) {
    await TextToSpeech.speak({
      text: chunk,
      lang: language,
      rate: style.rate,
      pitch: style.pitch,
      volume: style.volume,
      category: 'ambient',
      queueStrategy: 0,
    });
  }
};

export const speakMasterResponse = async (text: string, settings: SettingsState) => {
  if (!settings.voices || !text) return;

  const polishedText = normalizeMasterTone(text);
  const chunks = splitSpeechChunks(polishedText);

  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('ultimo-vestigio:master-speech-start'));
  }

  try {
    if (Capacitor.isNativePlatform()) {
      try {
        await speakWithNativeTts(chunks, settings);
        return;
      } catch (nativeError) {
        console.warn('TTS nativo indisponível; usando fallback web.', nativeError);
      }
    }

    await speakWithWebSpeech(chunks, settings);
  } finally {
    if (isBrowser) {
      window.dispatchEvent(new CustomEvent('ultimo-vestigio:master-speech-end'));
    }
  }
};
