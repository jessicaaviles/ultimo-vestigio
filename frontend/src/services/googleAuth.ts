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

const loadGoogleIdentityScript = async () => {
  if (!document.getElementById(GOOGLE_SCRIPT_ID)) {
    await new Promise<void>((resolve, reject) => {
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
};

export const initializeWebGoogleButton = async (
  container: HTMLElement,
  clientId: string,
  mode: 'signin' | 'signup',
  onCredential: GoogleCredentialCallback,
) => {
  await loadGoogleIdentityScript();

  window.google?.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      if (response?.credential) {
        onCredential(response.credential);
      }
    },
    cancel_on_tap_outside: false,
  });

  window.google?.accounts.id.renderButton(container, {
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
