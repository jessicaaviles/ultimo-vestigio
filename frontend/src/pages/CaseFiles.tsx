import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { useInvestigation } from '../contexts/InvestigationContext';

const CaseFiles: React.FC = () => {
  const navigate = useNavigate();
  const { discoveredClues } = useInvestigation();

  const allEvidences = [
    { id: 'fireplace', title: 'Carta Anônima', type: 'Documento', date: '12/05', image: '/backgrounds/ev_letter.png' },
    { id: 'armchair', title: 'Chave do quarto 7', type: 'Item Físico', date: '13/05', image: '/backgrounds/ev_key_7.png' },
    { id: 'window', title: 'Foto da Família', type: 'Foto', date: '13/05', image: '/backgrounds/ev_photo.png' },
    { id: 'table', title: 'Diário de Elisa', type: 'Documento', date: '14/05', image: '/backgrounds/ev_diary.png' },
    { id: 'blood', title: 'Mancha de Sangue', type: 'Vestígio', date: '15/05', image: '/backgrounds/ev_blood.png' },
  ];

  const foundEvidences = allEvidences.filter(e => discoveredClues.includes(e.id));

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '96px' }}>
      
      {/* Header */}
      <header style={{ padding: '48px 24px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F8F9FA', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F8F9FA' }}>
            <Search size={18} />
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F8F9FA' }}>
            <Filter size={18} />
          </div>
        </div>
      </header>

      <div style={{ padding: '24px' }}>
        <span style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Inventário</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '4px 0 24px 0', color: '#F8F9FA', fontWeight: 400 }}>Arquivos do Caso</h1>
        
        {foundEvidences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#13191C', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#C5A880', fontSize: '32px', marginBottom: '16px' }}>?</div>
            <p style={{ color: '#8E989F', fontSize: '13px', lineHeight: 1.5 }}>Seu inventário está vazio.</p>
            <p style={{ color: '#8E989F', fontSize: '11px', opacity: 0.7 }}>Vá até a cena do crime ou no mapa para procurar vestígios.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {foundEvidences.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/evidence/${item.id}`)}
                style={{ backgroundColor: '#13191C', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div>
                  <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>{item.type}</div>
                  <div style={{ color: '#F8F9FA', fontSize: '16px', fontWeight: 600 }}>{item.title}</div>
                  <div style={{ color: '#8E989F', fontSize: '11px' }}>Coletada em {item.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CaseFiles;
