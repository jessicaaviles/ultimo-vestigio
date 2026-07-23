import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, LayoutGrid, ChevronRight } from 'lucide-react';
import { useInvestigation } from '../contexts/InvestigationContext';

const MapOverview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPin, setSelectedPin] = useState<string | null>('living_room');

  const { discoveredClues } = useInvestigation();
  const libraryUnlocked = discoveredClues.includes('fireplace');
  const bedroomUnlocked = discoveredClues.includes('desk_letter');
  const gardenUnlocked = discoveredClues.includes('mirror_msg');

  const locations = [
    { id: 'bedroom', title: 'Quarto Principal', status: bedroomUnlocked ? 'investigating' : 'locked', top: '25%', left: '45%', lineDirection: 'right', totalPistas: 3, clueIds: ['mirror_msg', 'suitcase', 'pills'], image: '/backgrounds/scene_bedroom_landscape.png?v=11', desc: 'Aposentos de Clara. Um cômodo cheio de segredos bem guardados.' },
    { id: 'library', title: 'Biblioteca', status: libraryUnlocked ? 'investigating' : 'locked', top: '35%', left: '70%', lineDirection: 'down', totalPistas: 3, clueIds: ['desk_letter', 'safe', 'cigar'], image: '/backgrounds/scene_library_landscape.png?v=11', desc: 'O escritório particular e santuário de Tomás.' },
    { id: 'living_room', title: 'Sala de Estar', status: 'investigating', top: '55%', left: '30%', lineDirection: 'up', totalPistas: 3, clueIds: ['fireplace', 'blood', 'wine_glass'], image: '/backgrounds/scene_living_room_landscape.png?v=11', desc: 'Principal ponto de encontro da família. Foi aqui que Clara Mendes foi vista pela última vez.' },
    { id: 'garden', title: 'Jardim', status: gardenUnlocked ? 'investigating' : 'locked', top: '70%', left: '60%', lineDirection: 'left', totalPistas: 3, clueIds: ['fountain', 'mud', 'animal_bones'], image: '/backgrounds/scene_garden_landscape.png?v=11', desc: 'Os vastos jardins da mansão contêm mais segredos do que parecem.' }
  ];

  const totalPossibleClues = 12;
  const progressPercent = Math.round((discoveredClues.length / totalPossibleClues) * 100);

  const selectedLocation = locations.find(l => l.id === selectedPin) || locations[3]; // default to living room
  const foundPistasInSelected = discoveredClues.filter(c => selectedLocation.clueIds.includes(c)).length;
  const mockedFoundPistas = Math.min(foundPistasInSelected + (selectedLocation.status === 'locked' ? 0 : 2), selectedLocation.totalPistas); // Just for visual similarity to mockup

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Background Completo (Planta Baixa) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/backgrounds/map_blackwell.png?v=13)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        opacity: 0.8
      }} />

      {/* Fade Superior e Inferior para escurecer o mapa */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh',
        background: 'linear-gradient(180deg, #0A0D10 0%, rgba(10,13,16,0.3) 50%, rgba(10,13,16,0) 100%)', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50vh',
        background: 'linear-gradient(0deg, #0A0D10 0%, #0A0D10 20%, rgba(10,13,16,0.5) 60%, rgba(10,13,16,0) 100%)', zIndex: 1
      }} />

      {/* Header Topo - Reformulado */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 24px', marginTop: '100px' }}>
          
          {/* Coluna Esquerda: Título e Texto */}
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <span style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Planta Baixa</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '8px 0', color: '#F8F9FA', fontWeight: 400, lineHeight: 1.1, wordWrap: 'break-word' }}>
              Mansão<br/>Blackwell
            </h1>
            <p style={{ color: '#8E989F', fontSize: '13px', margin: '8px 0 24px 0', lineHeight: 1.5 }}>
              Selecione um cômodo para investigar.
            </p>
          </div>
          
          {/* Coluna Direita: Ações e Progresso */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', width: '80px', flexShrink: 0 }}>
            
            {/* Botão do Quadro de Cortiça */}
            <button 
              onClick={() => navigate('/board/blackwell')}
              style={{ 
                background: 'rgba(197, 168, 128, 0.1)', border: '1px solid rgba(197, 168, 128, 0.3)', 
                color: '#C5A880', padding: '12px 0', borderRadius: '12px', cursor: 'pointer',
                backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)', transition: 'all 0.2s ease', width: '100%'
              }}
            >
              <LayoutGrid size={20} />
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Quadro</span>
            </button>

            {/* Box de Progresso Menor */}
            <div style={{ 
              background: 'rgba(197, 168, 128, 0.1)', border: '1px solid rgba(197, 168, 128, 0.3)', 
              padding: '12px 10px', borderRadius: '12px',
              backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)', width: '100%', boxSizing: 'border-box'
            }}>
              <span style={{ color: '#C5A880', fontSize: '14px', fontWeight: 700 }}>{progressPercent}%</span>
              <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#C5A880' }} />
              </div>
              <span style={{ fontSize: '7px', color: '#8E989F', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Pistas</span>
            </div>

          </div>
        </div>
      </div>

      {/* Área Interativa do Mapa */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, minHeight: '400px' }}>
        {locations.map((loc) => {
          const isSelected = selectedPin === loc.id;
          const found = Math.min(discoveredClues.filter(c => loc.clueIds.includes(c)).length + (loc.status === 'locked' ? 0 : 2), loc.totalPistas);
          
          let transform = 'translate(-50%, -100%)';
          let flexDir: any = 'column';
          if (loc.lineDirection === 'up') { transform = 'translate(-50%, 0%)'; flexDir = 'column-reverse'; }
          if (loc.lineDirection === 'left') { transform = 'translate(0%, -50%)'; flexDir = 'row-reverse'; }
          if (loc.lineDirection === 'right') { transform = 'translate(-100%, -50%)'; flexDir = 'row'; }

          const isVertical = loc.lineDirection === 'up' || loc.lineDirection === 'down' || !loc.lineDirection;

          return (
            <button
              key={loc.id}
              onClick={() => setSelectedPin(loc.id)}
              style={{
                position: 'absolute', top: loc.top, left: loc.left,
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                transform, 
                cursor: 'pointer', display: 'flex', flexDirection: flexDir, alignItems: 'center', 
                zIndex: isSelected ? 10 : 1
              }}
            >
              {/* Glassmorphic Box */}
              <div style={{
                background: 'rgba(10, 13, 16, 0.75)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isSelected ? 'rgba(197, 168, 128, 0.8)' : 'rgba(197, 168, 128, 0.3)'}`,
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                transition: 'border 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-serif)' }}>{loc.title}</span>
                <span style={{ color: '#8E989F', fontSize: '10px' }}>{found}/{loc.totalPistas} pistas</span>
              </div>
              
              {/* Line */}
              <div style={{
                width: isVertical ? '1px' : '30px', height: isVertical ? '30px' : '1px', 
                background: isSelected ? 'rgba(197, 168, 128, 0.8)' : 'rgba(197, 168, 128, 0.4)',
                transition: 'background 0.3s ease'
              }} />

              {/* The Ring */}
              <div style={{
                width: '18px', height: '18px',
                borderRadius: '50%',
                backgroundColor: 'rgba(10, 13, 16, 0.8)',
                border: `2px solid ${isSelected ? '#C5A880' : 'rgba(197,168,128,0.5)'}`,
                boxShadow: isSelected ? '0 0 10px rgba(197,168,128,0.5)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}>
                <div style={{
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  backgroundColor: loc.status === 'locked' ? 'transparent' : '#C5A880',
                }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Card Fixo de Local em Destaque (Bottom Card) */}
      <div style={{ position: 'relative', zIndex: 3, padding: '0 16px', marginBottom: '80px' }}>
        <div style={{
          background: '#0D1115',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            {/* Imagem miniatura da Sala */}
            <div style={{
              width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
              backgroundImage: `url(${selectedLocation.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.1)'
            }} />
            
            {/* Título e Descrição */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ color: '#8E989F', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Local em Destaque</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: 0, color: '#F8F9FA', fontWeight: 400 }}>{selectedLocation.title}</h2>
                <ChevronRight size={16} color="#8E989F" />
              </div>
              <p style={{ color: '#8E989F', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                {selectedLocation.desc}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Progresso de Pistas (Esquerda) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(197, 168, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={14} color="#C5A880" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#8E989F', fontSize: '11px', marginBottom: '4px' }}>
                  <strong style={{ color: '#F8F9FA' }}>{mockedFoundPistas} de {selectedLocation.totalPistas}</strong> pistas encontradas
                </div>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{ width: `${(mockedFoundPistas / selectedLocation.totalPistas) * 100}%`, height: '100%', background: '#C5A880' }} />
                </div>
              </div>
            </div>

            {/* Botão de Explorar (Direita) */}
            <button
              onClick={() => selectedLocation.status === 'locked' ? null : navigate(`/scene/${selectedLocation.id}`)}
              style={{
                background: selectedLocation.status === 'locked' ? 'rgba(255,255,255,0.05)' : '#C4A77F',
                border: 'none', color: selectedLocation.status === 'locked' ? '#8E989F' : '#0A0D10',
                padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px', cursor: selectedLocation.status === 'locked' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap'
              }}
            >
              Explorar local <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MapOverview;
