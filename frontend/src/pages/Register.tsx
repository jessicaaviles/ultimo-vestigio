import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authRegister, authLink, authGoogle } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import { Capacitor } from '@capacitor/core';
import { initializeWebGoogleButton, signInWithGoogle } from '../services/googleAuth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const { refresh } = useAuth();
  const location = useLocation();
  const returnUrl = new URLSearchParams(location.search).get('return') || '';
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const isWebPlatform = Capacitor.getPlatform() === 'web';

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await authGoogle(credential, displayNameRef.current || undefined);
      if (res.success) {
        localStorage.setItem('authToken', res.data.authToken);
        localStorage.setItem('userId', res.data.userId);
        const refreshed = await refresh();
        navigate(refreshed?.onboardingCompleted ? (returnUrl || '/cases') : `/onboarding?return=${encodeURIComponent(returnUrl || '/cases')}`);
      } else {
        setError(res.error || 'Erro ao autenticar com Google.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [navigate, refresh, returnUrl]);

  const handleGoogleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithGoogle(import.meta.env.VITE_GOOGLE_CLIENT_ID);
      await handleGoogleCredential(credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar com Google.');
      setLoading(false);
    }
  }, [handleGoogleCredential, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Preencha todos os campos.');
    if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    setLoading(true);
    setError('');
    try {
      const existingUserId = localStorage.getItem('userId');
      const res = existingUserId
        ? await authLink(email, password, existingUserId)
        : await authRegister(email, password, displayName || undefined);
      if (res.success) {
        localStorage.setItem('authToken', res.data.authToken);
        localStorage.setItem('userId', res.data.userId);
        const refreshed = await refresh();
        navigate(refreshed?.onboardingCompleted ? (returnUrl || '/cases') : `/onboarding?return=${encodeURIComponent(returnUrl || '/cases')}`);
      } else {
        setError(res.error || 'Erro ao criar conta.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const container = googleButtonRef.current;
    if (!clientId || !container) return;

    if (isWebPlatform) {
      void initializeWebGoogleButton(container, clientId, 'signup', handleGoogleCredential);
    }
  }, [handleGoogleCredential, isWebPlatform]);

  return (
    <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <span className="eyebrow">Novo investigador</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, margin: '0 0 24px' }}>Criar Conta</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Crie sua conta para participar das investigações e salvar seu progresso.
        </p>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            {isWebPlatform ? (
              <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }} />
            ) : (
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                style={{
                  width: '100%',
                  maxWidth: 380,
                  margin: '0 auto 24px',
                  display: 'block',
                  borderRadius: 999,
                  border: '1px solid var(--line)',
                  background: '#11181c',
                  color: '#F8F9FA',
                  padding: '14px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Conectando...' : 'Continuar com Google'}
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Nome de investigador
            <input className="input-field" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={32} placeholder="Como você quer ser chamado?" required />
          </label>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Email
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Senha
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error && <p role="alert" style={{ color: '#d79b8e', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <Loading small message="Criando conta..." /> : 'Criar Conta'}
          </button>
        </form>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
          Já tem conta?{' '}
          <button onClick={() => navigate(returnUrl ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login')} style={{ color: 'var(--gold-soft)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
