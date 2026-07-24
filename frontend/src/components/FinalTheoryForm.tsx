import React, { useState } from 'react';
import { useSocket } from '../contexts/useSocket';
import { PenTool, Skull, Target, AlertTriangle } from 'lucide-react';

interface FinalTheoryFormProps {
  roomId: string;
  userId: string;
  myTheory: any;
  theories: any[];
  players: any[];
}

const FinalTheoryForm: React.FC<FinalTheoryFormProps> = ({ roomId, userId, myTheory, theories, players }) => {
  const socket = useSocket();
  const [what, setWhat] = useState('');
  const [who, setWho] = useState('');
  const [how, setHow] = useState('');
  const [why, setWhy] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !what || !who || !how || !why) return;

    socket.emit('submit_theory', {
      roomId,
      userId,
      answers: {
        what_happened: what,
        who: who,
        how: how,
        why: why
      }
    });
  };

  if (myTheory) {
    return (
      <div style={{ backgroundColor: '#0A0D10', border: '1px solid rgba(197, 168, 128, 0.4)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 0 40px rgba(0,0,0,0.8) inset' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', color: '#C5A880' }}>✓</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#C5A880', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Acusação Registrada</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>Sua teoria final foi assinada e arquivada. O destino dos envolvidos agora depende dos seus colegas.</p>
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'inline-block' }}>
          <div style={{ color: '#C5A880', fontSize: '14px', fontWeight: 600 }}>{theories.length} de {players.length} investigadores</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px' }}>já enviaram seus relatórios.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0A0D10', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Cabelhaço estilo documento confidencial */}
      <div style={{ background: 'linear-gradient(90deg, #1A0505 0%, #0A0D10 100%)', padding: '24px', borderBottom: '1px solid rgba(255,0,0,0.1)' }}>
        <div style={{ color: '#ef4444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} /> Arquivo Confidencial — Relatório Final
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: '#F8F9FA', margin: '0 0 8px 0' }}>Acusação Oficial</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
          Preencha os campos abaixo com precisão forense. Uma vez enviado, este documento não poderá ser alterado. Seja direto.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* O Quê */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PenTool size={14} /> 1. O que aconteceu?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Descreva a natureza do crime (ex: homicídio, encenação de morte, roubo).</p>
          <textarea 
            required rows={2} value={what} onChange={e => setWhat(e.target.value)} 
            placeholder="Qual é o evento principal que estamos investigando?"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} 
          />
        </div>

        {/* Quem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skull size={14} /> 2. Quem é o culpado?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Indique os nomes dos responsáveis diretos e de possíveis cúmplices.</p>
          <input 
            required type="text" value={who} onChange={e => setWho(e.target.value)} 
            placeholder="Nome do(s) perpetrador(es)"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }} 
          />
        </div>

        {/* Como */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> 3. Como o plano foi executado?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Explique os métodos, ferramentas e a cronologia básica do evento.</p>
          <textarea 
            required rows={3} value={how} onChange={e => setHow(e.target.value)} 
            placeholder="Qual foi o modus operandi?"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} 
          />
        </div>

        {/* Por quê */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} /> 4. Por que eles fizeram isso?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Descreva a motivação (dinheiro, vingança, ocultar um segredo).</p>
          <textarea 
            required rows={3} value={why} onChange={e => setWhy(e.target.value)} 
            placeholder="Qual era o motivo?"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} 
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            marginTop: '16px', padding: '16px', 
            background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 100%)', 
            color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)'
          }}
        >
          Assinar e Enviar Acusação
        </button>
      </form>
    </div>
  );
};

export default FinalTheoryForm;
