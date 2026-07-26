import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const RecoveryCode: React.FC = () => {
  const { roomId } = useParams(); const navigate = useNavigate(); const query = new URLSearchParams(useLocation().search);
  const code = query.get('code') || 'indisponível'; const publicCode = query.get('publicCode') || ''; const invite = `${window.location.origin}/join?room=${publicCode}`;
  const copy = () => navigator.clipboard?.writeText(code);

  return (
    <div className="immersive-page is-fixed-height" style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0F1417',
      backgroundImage: `url(/backgrounds/recovery-code.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      position: 'relative'
    }}>
      {/* Overlay gradiente */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(15, 20, 23, 0.25) 0%, rgba(15, 20, 23, 0.9) 50%, #0F1417 100%)',
        zIndex: 0
      }}></div>

      {/* Conteúdo fixo no viewport */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, padding: '88px 24px calc(76px + env(safe-area-inset-bottom) + 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '16px' }}>

        {/* Cabeçalho */}
        <div>
          <span style={{ display: 'block', color: 'var(--eyebrow-gold)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: '8px' }}>Apenas para o anfitrião</span>
          <h2 style={{ fontSize: '30px', margin: '0 0 6px', fontFamily: 'var(--font-serif)', lineHeight: 1.1, fontWeight: 400, color: '#F8F9FA' }}>Código de recuperação</h2>
          <p style={{ color: '#8E989F', fontSize: '13px', maxWidth: '85%', fontWeight: 300 }}>Guarde este código. Ele permite recuperar o controle da sala. Não compartilhe.</p>
        </div>

        {/* Código de recuperação */}
        <div>
          <label style={{ display: 'block', marginBottom: '10px', color: 'var(--eyebrow-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', fontWeight: 600 }}>Código de recuperação</label>
          <div style={{
            width: '100%', padding: '14px', borderRadius: '8px',
            fontSize: '22px', letterSpacing: '8px', textAlign: 'center',
            fontFamily: 'var(--font-sans)', fontWeight: 700,
            backgroundColor: 'rgba(15, 20, 23, 0.7)',
            color: 'var(--gold-soft)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(184,153,83,.3)',
            wordBreak: 'break-all'
          }}>{code}</div>
        </div>

        {/* Convite da equipe */}
        <div>
          <label style={{ display: 'block', marginBottom: '10px', color: 'var(--eyebrow-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', fontWeight: 600 }}>Convite da equipe</label>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            padding: '14px 16px', borderRadius: '8px',
            backgroundColor: 'rgba(15, 20, 23, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, letterSpacing: '6px', color: 'var(--gold-soft)' }}>{publicCode || '------'}</span>
              <button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(invite)} style={{ fontSize: '11px', minHeight: '34px', padding: '0 14px', width: 'fit-content' }}>Copiar link</button>
            </div>
            <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', flexShrink: 0 }}>
              <QRCodeCanvas value={invite} size={96} bgColor="#ffffff" fgColor="#182126" />
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={copy} style={{ flex: 1, justifyContent: 'center' }}>Copiar código</button>
          <button className="btn-primary" onClick={() => navigate(`/room/${roomId}/lobby`)} style={{ flex: 1, justifyContent: 'center', padding: '14px 16px', fontSize: '13px' }}>Continuar para o lobby</button>
        </div>
      </div>
    </div>
  );
};
export default RecoveryCode;
