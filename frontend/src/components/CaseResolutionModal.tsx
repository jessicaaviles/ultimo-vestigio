import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, ChevronRight, X } from 'lucide-react';

interface CaseResolutionModalProps {
  onClose: () => void;
}

const CaseResolutionModal: React.FC<CaseResolutionModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<'success' | 'failure' | null>(null);

  const questions = [
    {
      title: 'Quem é o responsável principal?',
      options: ['Clara Mendes', 'Sr. Tomás Blackwell', 'Helena'],
      correct: 'Sr. Tomás Blackwell'
    },
    {
      title: 'Qual foi a motivação principal do crime?',
      options: ['Disputa por herança', 'Vingança pessoal', 'Ocultar um segredo do passado'],
      correct: 'Ocultar um segredo do passado'
    },
    {
      title: 'Qual evidência chave comprova essa teoria?',
      options: ['Carta Anônima', 'Diário de Elisa', 'Chave do quarto 7'],
      correct: 'Diário de Elisa'
    }
  ];

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [step]: option }));
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Validate answers
      const isCorrect = questions.every((q, idx) => answers[idx] === q.correct);
      setResult(isCorrect ? 'success' : 'failure');
    }
  };

  const renderResult = () => {
    if (result === 'success') {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(34, 197, 94, 0.5)', boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle size={40} color="#4ade80" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: '#F8F9FA', margin: '0 0 16px 0', fontWeight: 400 }}>Caso Encerrado</h2>
          <p style={{ color: '#8E989F', fontSize: '14px', lineHeight: 1.5, marginBottom: '32px', maxWidth: '300px', margin: '0 auto 32px auto' }}>
            Sua dedução foi precisa. As peças se encaixam perfeitamente e a verdade sobre Blackwell House finalmente veio à tona.
          </p>
          <button 
            onClick={onClose}
            style={{ 
              background: '#C4A77F', border: 'none', color: '#0A0D10', padding: '16px 32px', borderRadius: '24px', 
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
              boxShadow: '0 4px 12px rgba(197, 168, 128, 0.3)'
            }}
          >
            Finalizar Relatório
          </button>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(239, 68, 68, 0.5)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)' }}>
          <XCircle size={40} color="#f87171" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: '#F8F9FA', margin: '0 0 16px 0', fontWeight: 400 }}>Teoria com Furos</h2>
        <p style={{ color: '#8E989F', fontSize: '14px', lineHeight: 1.5, marginBottom: '32px', maxWidth: '300px', margin: '0 auto 32px auto' }}>
          As evidências não sustentam sua hipótese. Revise as conexões no quadro e tente novamente.
        </p>
        <button 
          onClick={() => { setResult(null); setStep(0); setAnswers({}); }}
          style={{ 
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#F8F9FA', padding: '16px 32px', borderRadius: '24px', 
            fontSize: '13px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          Reavaliar Evidências
        </button>
      </div>
    );
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      background: 'rgba(10, 13, 16, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(10px)', padding: '24px'
    }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8F9FA', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px' }}>
          
          {result ? (
            renderResult()
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#C5A880' }}>
                <ShieldAlert size={18} />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Dedução Final</span>
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <div style={{ color: '#8E989F', fontSize: '12px', marginBottom: '8px' }}>Pergunta {step + 1} de {questions.length}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#F8F9FA', margin: '0', fontWeight: 400, lineHeight: 1.3 }}>
                  {questions[step].title}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {questions[step].options.map(option => (
                  <button 
                    key={option}
                    onClick={() => handleSelect(option)}
                    style={{
                      background: answers[step] === option ? 'rgba(197, 168, 128, 0.15)' : 'rgba(10, 13, 16, 0.6)',
                      border: answers[step] === option ? '1px solid #C5A880' : '1px solid rgba(255,255,255,0.1)',
                      color: answers[step] === option ? '#F8F9FA' : '#8E989F',
                      padding: '16px 20px', borderRadius: '12px', fontSize: '14px', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    {option}
                    {answers[step] === option && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C5A880' }} />}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleNext}
                disabled={!answers[step]}
                style={{ 
                  background: answers[step] ? '#F8F9FA' : 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  color: answers[step] ? '#0A0D10' : '#8E989F', 
                  padding: '16px', borderRadius: '16px', width: '100%',
                  fontSize: '13px', fontWeight: 700, cursor: answers[step] ? 'pointer' : 'not-allowed', 
                  textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {step === questions.length - 1 ? 'Submeter Teoria' : 'Próxima'}
                {step < questions.length - 1 && <ChevronRight size={16} />}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default CaseResolutionModal;
