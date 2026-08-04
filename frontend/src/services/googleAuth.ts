import { Capacitor } from '@capacitor/core';
import type { GoogleLoginResponseOnline, LoginResult } from '@capgo/capacitor-social-login';

declare global {
  interface Window {
    google?: any;
  }
}

type GoogleCredentialCallback = (credential: string) => void;

type SocialLoginModule = typeof import('@capgo/capacitor-social-login');

const GOOGLE_SCRIPT_ID = 'google-gis-script';
const isWebPlatform = () => Capacitor.getPlatform() === 'web';
let googleIdentityScriptPromise: Promise<void> | null = null;

const googleIdentityIsReady = () => Boolean(window.google?.accounts?.id);

const waitForGoogleIdentity = async () => {
  const startedAt = Date.now();
  while (!googleIdentityIsReady()) {
    if (Date.now() - startedAt > 5000) {
      throw new Error('Google Identity Services carregou, mas não ficou disponível na página.');
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
};

const loadGoogleIdentityScript = async () => {
  if (googleIdentityIsReady()) return;

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
      if (existingScript) {
        resolve();
        existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar o Google Identity Services.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o Google Identity Services.'));
      document.body.appendChild(script);
    });
  }

  await googleIdentityScriptPromise;
  await waitForGoogleIdentity();
};

export const initializeWebGoogleButton = async (
  container: HTMLElement,
  clientId: string,
  mode: 'signin' | 'signup',
  onCredential: GoogleCredentialCallback,
) => {
  await loadGoogleIdentityScript();

  if (!googleIdentityIsReady()) {
    throw new Error('Google Identity Services indisponível.');
  }

  container.replaceChildren();

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      if (response?.credential) {
        onCredential(response.credential);
      }
    },
    cancel_on_tap_outside: false,
  });

  window.google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text: mode === 'signin' ? 'signin_with' : 'signup_with',
    shape: 'pill',
    width: 380,
  });
};

const loadNativeSocialLogin = async () => {
  const imported = await import('@capgo/capacitor-social-login');
  return (imported as SocialLoginModule).SocialLogin;
};

export const signInWithGoogle = async (clientId?: string) => {
  if (isWebPlatform()) {
    throw new Error('Use initializeWebGoogleButton no navegador.');
  }

  const SocialLogin = await loadNativeSocialLogin();

  await SocialLogin.initialize({
    google: {
      webClientId: clientId,
      mode: 'online',
    },
  });

  const result = await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: ['email', 'profile'],
    },
  }) as LoginResult;

  const idToken = result.provider === 'google' && result.result.responseType === 'online'
    ? (result.result as GoogleLoginResponseOnline).idToken
    : null;
  if (!idToken) {
    throw new Error('Não foi possível obter o token do Google.');
  }

  return idToken;
};
