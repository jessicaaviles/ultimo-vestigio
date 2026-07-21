import React, { useState } from 'react';
import { Brain, CheckCircle2 } from 'lucide-react';
import { useInvestigation } from '../contexts/InvestigationContext';

const InvestigationBoard: React.FC = () => {
  const { discoveredClues } = useInvestigation();
  const [activeTab, setActiveTab] = useState('mural');

  // Hardcoded for the prototype to match the screenshot
  const cards = [
    { id: 'clara', type: 'person', image: '/backgrounds/equipe-investigadores.png', title: 'Clara Mendes', label: 'Desaparecida 12/05 - 20h', top: '10%', left: '15%', rotation: '-5deg' },
    { id: 'letter', type: 'note', text: 'Carta anônima\n\nVocês pensam que sabem a verdade. Mas a casa guarda o que vocês preferem esquecer.', top: '12%', left: '40%', rotation: '2deg' },
    { id: 'tomas', type: 'person', image: '/backgrounds/equipe-investigadores.png', title: 'Sr. Tomás Blackwell', label: '?', top: '15%', left: '70%', rotation: '4deg' },
    { id: 'house', type: 'location', image: '/backgrounds/map_blackwell.png', title: 'Blackwell House', top: '45%', left: '35%', rotation: '-2deg' },
    { id: 'key', type: 'item', image: '/backgrounds/ev_key_7.png', title: 'Chave do quarto 7', label: 'Encontrada na sala de estar', top: '55%', left: '5%', rotation: '-8deg' },
    { id: 'helena', type: 'person', image: '/backgrounds/equipe-investigadores.png', title: 'Helena', label: 'Amiga próxima', top: '65%', left: '38%', rotation: '3deg' },
    { id: 'diary', type: 'item', image: '/backgrounds/ev_diary.png', title: 'Diário de Elisa', label: 'Última anotação: 11/05', top: '55%', left: '72%', rotation: '-4deg' },
  ];

  const totalClues = 5;
  const cluesFound = discoveredClues.length;
  const progress = Math.round((cluesFound / totalClues) * 100);

  const renderPin = () => (
    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#991b1b', boxShadow: '2px 2px 4px rgba(0,0,0,0.5)', zIndex: 10, border: '2px solid #7f1d1d' }}>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ef4444', position: 'absolute', top: '2px', left: '2px' }} />
    </div>
  );

  const renderTape = () => (
    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: '60px', height: '20px', backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
  );

  const renderLabel = (text: string) => (
    <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', backgroundColor: '#d4c790', padding: '6px 10px', transform: 'rotate(-4deg)', boxShadow: '2px 4px 8px rgba(0,0,0,0.3)', fontFamily: '"Kalam", cursive', fontSize: '10px', color: '#1a1a1a', zIndex: 5, maxWidth: '80px', textAlign: 'center', lineHeight: 1.2 }}>
      {text}
    </div>
  );

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Background Topo */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '45vh',
        backgroundImage: 'url(/backgrounds/map_blackwell.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        opacity: 0.6
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '45vh',
        background: 'linear-gradient(180deg, #0A0D10 0%, rgba(10,13,16,0.3) 30%, rgba(10,13,16,0.9) 80%, #1c1917 100%)', zIndex: 1
      }} />

      {/* Header Topo */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Título do Caso */}
        <div style={{ padding: '0 24px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Investigação</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '8px 0', color: '#F8F9FA', fontWeight: 400, lineHeight: 1.1 }}>O Segredo de<br/>Blackwell House</h1>
            <p style={{ color: '#8E989F', fontSize: '13px', margin: '8px 0 24px 0', maxWidth: '80%', lineHeight: 1.5 }}>
              Conecte pistas, descubra relações e revele a verdade.
            </p>
          </div>
          {progress === 100 && (
            <button 
              onClick={() => alert('Parabéns! Você resolveu o caso do protótipo!')}
              style={{ background: 'var(--olive)', border: 'none', color: '#13191C', padding: '12px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(197,168,128,0.3)' }}
            >
              <CheckCircle2 size={24} />
              Resolver
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 24px', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginTop: '16px', WebkitOverflowScrolling: 'touch' }}>
          {['mural', 'pistas', 'pessoas', 'locais', 'linha do tempo'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ 
                background: 'none', border: 'none', padding: '0 0 16px 0', color: activeTab === tab ? '#C5A880' : '#8E989F',
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: activeTab === tab ? '2px solid #C5A880' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Board Area */}
      <div style={{ flex: 1, position: 'relative', backgroundImage: 'url(/backgrounds/corkboard_texture.png)', backgroundSize: 'cover', backgroundAttachment: 'fixed', zIndex: 2, overflow: 'hidden' }}>
        
        {/* Overlay escuro sobre a cortiça */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20, 15, 10, 0.8)' }} />

        {activeTab === 'mural' ? (
          <>
            {/* SVG Strings layer */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
              <filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.5"/></filter>
              <line x1="28%" y1="20%" x2="45%" y2="25%" stroke="#991b1b" strokeWidth="2" filter="url(#shadow)" />
              <line x1="75%" y1="25%" x2="55%" y2="52%" stroke="#991b1b" strokeWidth="2" filter="url(#shadow)" />
              <line x1="25%" y1="38%" x2="45%" y2="55%" stroke="#991b1b" strokeWidth="2" filter="url(#shadow)" />
              <line x1="15%" y1="65%" x2="35%" y2="58%" stroke="#991b1b" strokeWidth="2" filter="url(#shadow)" />
              <line x1="80%" y1="65%" x2="65%" y2="58%" stroke="#991b1b" strokeWidth="2" filter="url(#shadow)" />
              <line x1="50%" y1="75%" x2="50%" y2="65%" stroke="#991b1b" strokeWidth="2" filter="url(#shadow)" />
            </svg>

            {/* Cards */}
            {cards.map((card) => (
              <div key={card.id} style={{ position: 'absolute', top: card.top, left: card.left, transform: `rotate(${card.rotation})`, zIndex: 2, width: '90px' }}>
                {card.type === 'note' ? (
                  <div style={{ backgroundColor: '#d4c790', padding: '12px 10px', boxShadow: '2px 4px 10px rgba(0,0,0,0.5)', fontFamily: '"Kalam", cursive', fontSize: '10px', color: '#1a1a1a', lineHeight: 1.4, position: 'relative' }}>
                    {renderTape()}
                    {card.text}
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#e5e5e5', padding: '6px 6px 16px 6px', boxShadow: '4px 6px 12px rgba(0,0,0,0.6)', position: 'relative', borderRadius: '2px' }}>
                    {renderPin()}
                    <div style={{ width: '100%', height: '80px', backgroundImage: `url(${card.image})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '8px', filter: 'sepia(0.3)' }} />
                    <div style={{ fontFamily: '"Kalam", cursive', fontSize: '11px', color: '#1a1a1a', textAlign: 'center', lineHeight: 1 }}>{card.title}</div>
                    {card.label && renderLabel(card.label)}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '24px', textAlign: 'center' }}>
            <div>
              <div style={{ color: '#C5A880', fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>?</div>
              <h3 style={{ color: '#F8F9FA', fontSize: '18px', marginBottom: '8px' }}>Conteúdo em construção</h3>
              <p style={{ color: '#8E989F', fontSize: '13px' }}>A aba "{activeTab}" será implementada na próxima versão do sistema.</p>
            </div>
          </div>
        )}

        {/* Controls Overlay Bottom */}
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', zIndex: 5, display: 'flex', gap: '12px' }}>
          
          <div style={{ background: 'rgba(19,25,28,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(10px)' }}>
            <div style={{ position: 'relative' }}>
              <Brain size={24} color="#8E989F" />
              <div style={{ position: 'absolute', top: '-4px', right: '-8px', background: '#991b1b', color: 'white', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '10px' }}>3</div>
            </div>
            <div>
              <div style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 600 }}>Análise da IA</div>
              <div style={{ color: '#8E989F', fontSize: '10px' }}>Padrões detectados</div>
            </div>
          </div>

          <div style={{ background: 'rgba(19,25,28,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', flex: 1, backdropFilter: 'blur(10px)' }}>
            <div style={{ color: '#C5A880', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '8px' }}>Pistas Encontradas</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#F8F9FA', fontSize: '16px', fontWeight: 600 }}>{cluesFound} <span style={{ color: '#8E989F', fontSize: '12px' }}>/ {totalClues}</span></span>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', flex: 1, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#C5A880', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default InvestigationBoard;
