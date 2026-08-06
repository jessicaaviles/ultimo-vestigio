import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addFriend, authLogin, authGoogle } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import { Capacitor } from '@capacitor/core';
import { Eye, EyeOff } from 'lucide-react';
import { initializeWebGoogleButton, signInWithGoogle } from '../services/googleAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = new URLSearchParams(location.search).get('return') || '';
  const invitedBy = new URLSearchParams(location.search).get('friend') || '';
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleAuthInFlightRef = useRef(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleConfigured = Boolean(googleClientId);
  const isWebPlatform = Capacitor.getPlatform() === 'web';

  const connectInviter = useCallback(async (userId: string) => {
    if (!invitedBy || invitedBy === userId) return;
    await addFriend(userId, invitedBy, true).catch(() => undefined);
  }, [invitedBy]);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await authGoogle(credential);
      if (res.success) {
        localStorage.setItem('authToken', res.data.authToken);
        localStorage.setItem('userId', res.data.userId);
        await connectInviter(res.data.userId);
        await refresh();
        navigate(returnUrl || '/profile');
      } else {
        setError(res.error || 'Erro ao autenticar com Google.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [connectInviter, navigate, refresh, returnUrl]);

  const handleGoogleClick = useCallback(async () => {
    if (loading || googleAuthInFlightRef.current) return;
    googleAuthInFlightRef.current = true;
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithGoogle(import.meta.env.VITE_GOOGLE_CLIENT_ID);
      await handleGoogleCredential(credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar com Google.');
      setLoading(false);
    } finally {
      googleAuthInFlightRef.current = false;
    }
  }, [handleGoogleCredential, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Preencha todos os campos.');
    setLoading(true);
    setError('');
    try {
      const res = await authLogin(email, password);
      if (res.success) {
        localStorage.setItem('authToken', res.data.authToken);
        localStorage.setItem('userId', res.data.userId);
        await connectInviter(res.data.userId);
        await refresh();
        navigate(returnUrl || '/profile');
      } else {
        setError(res.error || 'Erro ao fazer login.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const container = googleButtonRef.current;
    if (!googleClientId || !container) return;

    if (isWebPlatform) {
      void initializeWebGoogleButton(container, googleClientId, 'signin', handleGoogleCredential)
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Erro ao carregar login com Google.');
        });
    }
  }, [googleClientId, handleGoogleCredential, isWebPlatform]);

  return (
    <div className="profile-page profile-editor-page" style={{ minHeight: '100vh', backgroundColor: '#0F1417', color: '#F8F9FA', padding: '24px 24px 96px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <span className="eyebrow">Acesso</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, margin: '0 0 24px' }}>Entrar</h1>

        {googleConfigured ? (
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
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
            Login com Google ainda não foi configurado neste ambiente.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Email
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Senha
            <div className="password-field">
              <input className="input-field" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && <p role="alert" style={{ color: '#d79b8e', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <Loading small message="Entrando..." /> : 'Entrar'}
          </button>
        </form>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
          Ainda não tem conta?{' '}
          <button onClick={() => navigate(returnUrl ? `/register?return=${encodeURIComponent(returnUrl)}` : '/register')} style={{ color: 'var(--gold-soft)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
            Criar conta
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
