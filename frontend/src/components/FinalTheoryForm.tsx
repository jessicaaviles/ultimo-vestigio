import React, { useState } from 'react';
import { useSocket } from '../contexts/useSocket';
import { PenTool, Search, Target, AlertTriangle, Check, Fingerprint, UserRound } from 'lucide-react';

interface CaseSuspect {
  id: string;
  name: string;
  age?: number;
  role?: string;
  description?: string;
  image?: string;
  clueCount?: number;
  isOtherOption?: boolean;
}

interface FinalTheoryFormProps {
  roomId: string;
  userId: string;
  myTheory: any;
  theories: any[];
  players: any[];
  suspects?: CaseSuspect[];
}

const suspectPortraits: Record<string, string> = {
  augusto: '/suspects/augusto-alvarenga.png',
  'augusto alvarenga': '/suspects/augusto-alvarenga.png',
  bruno: '/suspects/bruno-tavares.png',
  'bruno tavares': '/suspects/bruno-tavares.png',
  cecilia: '/suspects/cecilia-alvarenga.png',
  'cecília alvarenga': '/suspects/cecilia-alvarenga.png',
  celina: '/suspects/celina-prado.png',
  'celina prado': '/suspects/celina-prado.png',
  dario: '/suspects/dario-velloso.png',
  'dario velloso': '/suspects/dario-velloso.png',
  heitor: '/suspects/heitor-campos.png',
  'heitor campos': '/suspects/heitor-campos.png',
  helena_duarte: '/suspects/helena-duarte.png',
  'helena duarte': '/suspects/helena-duarte.png',
  inae: '/suspects/inae-moura.png',
  'inae moura': '/suspects/inae-moura.png',
  lucia: '/suspects/lucia-ferraz.png',
  'lúcia ferraz': '/suspects/lucia-ferraz.png',
  marina: '/suspects/marina-reis.png',
  'marina reis': '/suspects/marina-reis.png',
  marta: '/suspects/marta-nobrega.png',
  'marta nóbrega': '/suspects/marta-nobrega.png',
  otavio: '/suspects/otavio-nunes.png',
  'otávio nunes': '/suspects/otavio-nunes.png',
  padre_miguel: '/suspects/padre-miguel.png',
  'padre miguel': '/suspects/padre-miguel.png',
  renato: '/suspects/renato-salles.png',
  'renato salles': '/suspects/renato-salles.png',
  renato_alvares: '/suspects/renato-alvares.png',
  'renato álvares': '/suspects/renato-alvares.png',
  sara: '/suspects/sara-fontes.png',
  'sara fontes': '/suspects/sara-fontes.png',
  tomas: '/suspects/tomas-arantes.png',
  'tomás arantes': '/suspects/tomas-arantes.png',
  vitor: '/suspects/vitor-leme.png',
  'vítor leme': '/suspects/vitor-leme.png'
};

export const getSuspectPortrait = (suspect: Pick<CaseSuspect, 'id' | 'name' | 'image'>) => {
  if (suspect.image) return suspect.image;
  const id = String(suspect.id || '').toLowerCase();
  const name = String(suspect.name || '').toLowerCase();
  return suspectPortraits[id] || suspectPortraits[name] || '';
};

const FinalTheoryForm: React.FC<FinalTheoryFormProps> = ({ roomId, userId, myTheory, theories, players, suspects = [] }) => {
  const socket = useSocket();
  const [what, setWhat] = useState('');
  const [who, setWho] = useState('');
  const [how, setHow] = useState('');
  const [why, setWhy] = useState('');
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const hasSuspects = suspects.length > 0;

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

  const chooseSuspect = (suspect: CaseSuspect) => {
    setSelectedSuspectId(suspect.id);
    setWho(suspect.isOtherOption ? '' : suspect.name);
  };

  if (myTheory) {
    return (
      <div style={{ backgroundColor: '#0A0D10', border: '1px solid rgba(197, 168, 128, 0.4)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 0 40px rgba(0,0,0,0.8) inset' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', color: '#C5A880' }}>✓</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#C5A880', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Relatório Registrado</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>Sua teoria final foi assinada e arquivada. A conclusão da equipe agora depende dos seus colegas.</p>
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'inline-block' }}>
          <div style={{ color: '#C5A880', fontSize: '14px', fontWeight: 600 }}>{theories.length} de {players.length} investigadores</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px' }}>já enviaram seus relatórios.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0A0D10', border: '1px solid rgba(197,168,128,0.28)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Cabelhaço estilo documento confidencial */}
      <div style={{ background: 'linear-gradient(90deg, rgba(197,168,128,0.18) 0%, #0A0D10 100%)', padding: '24px', borderBottom: '1px solid rgba(197,168,128,0.16)' }}>
        <div style={{ color: 'var(--eyebrow-gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} /> Arquivo Confidencial — Relatório Final
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: '#F8F9FA', margin: '0 0 8px 0' }}>Relatório Final</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
          Preencha os campos abaixo com a conclusão da equipe. Uma vez enviado, este documento não poderá ser alterado. Seja direto.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* O Quê */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PenTool size={14} /> 1. O que aconteceu?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Explique, em uma frase, qual é a verdade central por trás da situação apresentada.</p>
          <textarea 
            required rows={2} value={what} onChange={e => setWhat(e.target.value)} 
            placeholder="O que realmente aconteceu neste caso?"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} 
          />
        </div>

        {/* Quem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} /> 2. Qual é a causa ou responsável?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>
            {hasSuspects ? 'Escolha a pessoa mais provável quando houver envolvimento humano. A teoria ainda precisa sustentar essa escolha.' : 'Indique a pessoa, causa, objeto, fenômeno ou condição que explica o mistério.'}
          </p>
          {hasSuspects ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {suspects.map((suspect) => {
                const selected = selectedSuspectId === suspect.id;
                const portrait = getSuspectPortrait(suspect);
                return (
                  <button
                    key={suspect.id}
                    type="button"
                    onClick={() => chooseSuspect(suspect)}
                    style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr 44px',
                      gap: '14px',
                      alignItems: 'center',
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '8px',
                      border: selected ? '1px solid rgba(245,214,129,0.75)' : '1px solid rgba(255,255,255,0.09)',
                      background: selected ? 'rgba(197,168,128,0.12)' : 'rgba(255,255,255,0.025)',
                      color: '#F8F9FA',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '8px',
                      border: '1px solid rgba(197,168,128,0.25)',
                      background: portrait ? `url(${portrait}) center / cover` : 'linear-gradient(145deg, rgba(197,168,128,0.18), rgba(255,255,255,0.03))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--eyebrow-gold)'
                    }}>
                      {!portrait && (suspect.isOtherOption ? <UserRound size={28} /> : <Fingerprint size={28} />)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: '#F8F9FA', lineHeight: 1.15 }}>{suspect.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', marginTop: '4px' }}>
                        {suspect.age ? `${suspect.age} anos · ` : ''}{suspect.role || 'Suspeito'}
                      </div>
                      {suspect.description && (
                        <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '12px', lineHeight: 1.45, margin: '8px 0 0' }}>{suspect.description}</p>
                      )}
                      <div style={{ color: 'var(--eyebrow-gold)', fontSize: '10px', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                        {suspect.isOtherOption ? 'suspeito alternativo' : `${suspect.clueCount || 0} pistas ligam a ele`}
                      </div>
                    </div>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      border: selected ? '1px solid rgba(245,214,129,0.9)' : '1px solid rgba(197,168,128,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: selected ? '#0A0D10' : 'var(--eyebrow-gold)',
                      background: selected ? 'var(--accent-gold)' : 'transparent',
                      justifySelf: 'end'
                    }}>
                      {selected && <Check size={18} />}
                    </div>
                  </button>
                );
              })}
              {selectedSuspectId && suspects.find(suspect => suspect.id === selectedSuspectId)?.isOtherOption && (
                <input
                  required
                  type="text"
                  value={who}
                  onChange={e => setWho(e.target.value)}
                  placeholder="Digite a pessoa, causa ou explicação principal"
                  style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }}
                />
              )}
            </div>
          ) : (
            <input 
              required type="text" value={who} onChange={e => setWho(e.target.value)} 
              placeholder="Pessoa, causa ou explicação principal"
              style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }} 
            />
          )}
        </div>

        {/* Como */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> 3. Como foi possível?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Explique o mecanismo, sequência ou condição escondida que torna a cena possível.</p>
          <textarea 
            required rows={3} value={how} onChange={e => setHow(e.target.value)}
            placeholder="Como a aparente impossibilidade se explica?"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} 
          />
        </div>

        {/* Por quê */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--eyebrow-gold)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} /> 4. Por que isso aconteceu?
          </label>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0' }}>Aponte o motivo, intenção ou finalidade por trás do evento. Em enigmas sem culpado humano, explique a causa da confusão.</p>
          <textarea 
            required rows={3} value={why} onChange={e => setWhy(e.target.value)}
            placeholder="Qual era o motivo, intenção ou finalidade?"
            style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} 
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            marginTop: '16px', padding: '16px', 
            background: 'linear-gradient(90deg, #b89953 0%, #f0d28a 100%)', 
            color: '#0A0D10', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 4px 15px rgba(184,153,83,0.28)'
          }}
        >
          Assinar e Enviar Relatório
        </button>
      </form>
    </div>
  );
};

export default FinalTheoryForm;
