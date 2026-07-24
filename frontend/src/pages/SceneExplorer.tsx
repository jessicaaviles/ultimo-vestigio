import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Brain } from 'lucide-react';
import { useInvestigation } from '../contexts/InvestigationContext';

const SceneExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [uvLight, setUvLight] = useState(false);

  const { unlockedClues } = useInvestigation();

  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { sceneId } = useParams<{ sceneId: string }>();
  const id = sceneId || 'living_room';
  
  const sceneConfig: Record<string, any> = {
    living_room: {
      title: 'Sala de Estar', subtitle: 'Cena do Crime', bgBase: '/backgrounds/scene_living_room',
      hotspotsLandscape: [
        { id: 'fireplace', label: 'Restos na Lareira', subLabel: 'Passagem aérea', top: '40%', left: '80%' },
        { id: 'blood', label: 'Sangue Artificial', subLabel: 'Sem respingos', top: '90%', left: '75%', requiresUv: true },
        { id: 'wine_glass', label: 'Taça Quebrada', subLabel: 'Briga ou acidente?', top: '75%', left: '25%' },
      ],
      hotspotsPortrait: [
        { id: 'fireplace', label: 'Restos na Lareira', subLabel: 'Passagem aérea', top: '40%', left: '80%' },
        { id: 'blood', label: 'Sangue Artificial', subLabel: 'Sem respingos', top: '90%', left: '75%', requiresUv: true },
        { id: 'wine_glass', label: 'Taça Quebrada', subLabel: 'Briga ou acidente?', top: '75%', left: '25%' },
      ]
    },
    library: {
      title: 'Biblioteca', subtitle: 'Escritório de Tomás', bgBase: '/backgrounds/scene_library',
      hotspotsLandscape: [
        { id: 'desk_letter', label: 'Carta de Helena', subLabel: 'Aviso urgente', top: '65%', left: '55%' },
        { id: 'safe', label: 'Cofre Oculto', subLabel: 'Trancado e vazio?', top: '50%', left: '22%' },
        { id: 'cigar', label: 'Charuto Apagado', subLabel: 'Visita recente', top: '70%', left: '45%' },
      ],
      hotspotsPortrait: [
        { id: 'desk_letter', label: 'Carta de Helena', subLabel: 'Aviso urgente', top: '65%', left: '55%' },
        { id: 'safe', label: 'Cofre Oculto', subLabel: 'Trancado e vazio?', top: '50%', left: '22%' },
        { id: 'cigar', label: 'Charuto Apagado', subLabel: 'Visita recente', top: '70%', left: '45%' },
      ]
    },
    bedroom: {
      title: 'Quarto Principal', subtitle: 'Aposentos de Clara', bgBase: '/backgrounds/scene_bedroom',
      hotspotsLandscape: [
        { id: 'mirror_msg', label: 'Mensagem no Espelho', subLabel: 'Escrita em segredo', top: '35%', left: '70%', requiresUv: true },
        { id: 'suitcase', label: 'Mala', subLabel: 'Roupas de frio intenso', top: '80%', left: '60%' },
        { id: 'pills', label: 'Remédios', subLabel: 'Para ansiedade', top: '55%', left: '25%' },
      ],
      hotspotsPortrait: [
        { id: 'mirror_msg', label: 'Mensagem no Espelho', subLabel: 'Escrita em segredo', top: '35%', left: '70%', requiresUv: true },
        { id: 'suitcase', label: 'Mala', subLabel: 'Roupas de frio intenso', top: '80%', left: '60%' },
        { id: 'pills', label: 'Remédios', subLabel: 'Para ansiedade', top: '55%', left: '25%' },
      ]
    },
    garden: {
      title: 'Jardins', subtitle: 'Área Externa', bgBase: '/backgrounds/scene_garden',
      hotspotsLandscape: [
        { id: 'fountain', label: 'Fonte de Pedra', subLabel: 'Livro-caixa queimado', top: '70%', left: '30%' },
        { id: 'mud', label: 'Pegadas na Lama', subLabel: 'Duas pessoas', top: '85%', left: '65%' },
        { id: 'animal_bones', label: 'Ossos Pequenos', subLabel: 'Cachorro ou humano?', top: '75%', left: '15%' },
      ],
      hotspotsPortrait: [
        { id: 'fountain', label: 'Fonte de Pedra', subLabel: 'Livro-caixa queimado', top: '70%', left: '30%' },
        { id: 'mud', label: 'Pegadas na Lama', subLabel: 'Duas pessoas', top: '85%', left: '65%' },
        { id: 'animal_bones', label: 'Ossos Pequenos', subLabel: 'Cachorro ou humano?', top: '75%', left: '15%' },
      ]
    }
  };

  const scene = sceneConfig[id] || sceneConfig['living_room'];
  const hotspots = isPortrait ? scene.hotspotsPortrait : scene.hotspotsLandscape;
  const currentBg = `${scene.bgBase}_${isPortrait ? 'portrait' : 'landscape'}.png?v=11`;
  const totalClues = hotspots.length;

  const handleHotspotClick = (clueId: string) => {
    navigate(`/evidence/${clueId}`);
  };

  const clueImages: Record<string, string> = {
    fireplace: '/backgrounds/ev_matches.png?v=11',
    blood: '/backgrounds/ev_receipt.png?v=11',
    wine_glass: '/backgrounds/ev_glass.png?v=11',
    desk_letter: '/backgrounds/ev_ledger.png?v=11',
    safe: '/backgrounds/ev_safe.png?v=11',
    cigar: '/backgrounds/ev_cigar.png?v=11',
    mirror_msg: '/backgrounds/ev_mirror.png?v=11',
    suitcase: '/backgrounds/ev_suitcase.png?v=11',
    pills: '/backgrounds/ev_pills.png?v=11',
    fountain: '/backgrounds/ev_fountain.png?v=11',
    mud: '/backgrounds/ev_mud.png?v=11',
    animal_bones: '/backgrounds/ev_bones.png?v=11'
  };

  const foundClues = unlockedClues
    .filter(c => hotspots.some((h: any) => h.id === c.clueId))
    .map(c => ({ id: c.clueId, url: clueImages[c.clueId] || '/backgrounds/ev_letter.png' }));

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Background da Cena */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url(${currentBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        filter: uvLight ? 'brightness(0.7) contrast(1.4) sepia(1) hue-rotate(240deg) saturate(2.5)' : 'none',
        transition: 'filter 0.5s ease'
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(10,13,16,0.9) 0%, rgba(10,13,16,0.3) 40%, rgba(10,13,16,0.8) 80%, #0A0D10 100%)', zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Informações Superiores e Minimapa */}
        <div style={{ display: 'flex', padding: '0 24px', marginTop: '100px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ color: 'var(--eyebrow-gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>{scene.subtitle}</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '0 0 8px 0', color: '#F8F9FA', fontWeight: 400 }}>{scene.title}</h1>
            <p style={{ color: '#8E989F', fontSize: '13px', margin: '0 0 24px 0', maxWidth: '200px', lineHeight: 1.4 }}>
              Explore a cena. Cada detalhe pode ser uma pista.
            </p>
            
            <div style={{ color: 'var(--eyebrow-gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>Pistas Encontradas</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ color: '#F8F9FA', fontSize: '24px', fontWeight: 400 }}>{foundClues.length}</span>
              <span style={{ color: '#8E989F', fontSize: '14px' }}>/ {totalClues}</span>
            </div>
          </div>


        </div>

        {/* Hotspots */}
        <div style={{ flex: 1, position: 'relative' }}>
          {hotspots.map((hotspot: any) => {
            if (hotspot.requiresUv && !uvLight) return null;
            return (
              <div 
                key={hotspot.id} 
                style={{ position: 'absolute', top: hotspot.top, left: hotspot.left, display: 'flex', alignItems: 'center', gap: '8px', transform: 'translate(-50%, -50%)', cursor: 'pointer' }}
                onClick={() => handleHotspotClick(hotspot.id)}
              >
                <div style={{ 
                  width: '24px', height: '24px', minWidth: '24px', flexShrink: 0, borderRadius: '50%', 
                  border: `1px solid ${hotspot.requiresUv && uvLight ? 'rgba(168, 85, 247, 0.8)' : 'rgba(197, 168, 128, 0.5)'}`, 
                  background: hotspot.requiresUv && uvLight ? 'rgba(168, 85, 247, 0.2)' : 'rgba(10,13,16,0.6)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
                  boxShadow: hotspot.requiresUv && uvLight ? '0 0 15px rgba(168, 85, 247, 0.5)' : 'none'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hotspot.requiresUv && uvLight ? '#D8B4FE' : '#C5A880' }} />
                </div>
                <div style={{ background: 'rgba(10,13,16,0.7)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)' }}>
                  <div style={{ color: hotspot.requiresUv && uvLight ? '#D8B4FE' : '#F8F9FA', fontSize: '11px', fontWeight: 600 }}>{hotspot.label}</div>
                  <div style={{ color: '#8E989F', fontSize: '9px' }}>{hotspot.subLabel}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '0 24px', marginTop: 'auto', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginBottom: '24px' }}>
            {/* UV Button */}
            <button 
              onClick={() => setUvLight(!uvLight)}
              style={{ 
                background: uvLight ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', 
                border: `1px solid ${uvLight ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255,255,255,0.1)'}`, 
                color: uvLight ? '#D8B4FE' : '#F8F9FA', 
                padding: '12px 16px', borderRadius: '24px', fontSize: '11px', fontWeight: 600, 
                display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
                boxShadow: uvLight ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none'
              }}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: uvLight ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
              </div>
              Visão com Luz UV
            </button>
          </div>

          {/* AI Tip Box */}
          <div style={{ background: '#13191C', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', display: 'flex', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}>
              <Brain size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--eyebrow-gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Dica da IA</div>
              <p style={{ color: '#F8F9FA', fontSize: '13px', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                Análise comportamental: As pistas (Carta e Chave) estão posicionadas de forma quase teatral, sugerindo uma cena montada.
              </p>
              <div style={{ color: '#8E989F', fontSize: '11px' }}>Confiança: 82%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#8E989F', cursor: 'pointer' }}><ThumbsUp size={14} /></button>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#8E989F', cursor: 'pointer' }}><ThumbsDown size={14} /></button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SceneExplorer;
