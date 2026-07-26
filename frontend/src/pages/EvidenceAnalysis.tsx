import React from 'react';
import { ArrowLeft, FileSearch } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const EvidenceAnalysis: React.FC = () => {
  const { evidenceId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0D10',
      color: '#F8F9FA',
      padding: '24px 24px calc(96px + env(safe-area-inset-bottom))',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: 'none',
          color: '#F8F9FA',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: 0,
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          border: '1px solid rgba(197, 168, 128, 0.35)',
          color: 'var(--accent-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(197, 168, 128, 0.08)'
        }}>
          <FileSearch size={28} />
        </div>

        <div>
          <span style={{
            display: 'block',
            color: 'var(--eyebrow-gold)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            Análise de evidência
          </span>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '32px',
            fontWeight: 400,
            lineHeight: 1.05,
            margin: 0
          }}>
            Pista indisponível
          </h1>
        </div>

        <p style={{
          color: '#C7CED2',
          fontSize: '15px',
          lineHeight: 1.6,
          margin: 0,
          maxWidth: '520px'
        }}>
          {evidenceId
            ? `A pista "${evidenceId}" ainda não possui dados carregados pelo backend.`
            : 'Esta pista ainda não possui dados carregados pelo backend.'}
        </p>

        <button
          onClick={() => navigate(-1)}
          style={{
            width: '100%',
            maxWidth: '360px',
            background: 'var(--accent-gold)',
            color: '#0A0D10',
            border: '1px solid rgba(245,214,129,0.55)',
            padding: '16px 20px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Voltar para investigação
        </button>
      </section>
    </div>
  );
};

export default EvidenceAnalysis;
