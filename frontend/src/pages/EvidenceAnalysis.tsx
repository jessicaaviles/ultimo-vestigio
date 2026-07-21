import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Search, Fingerprint, Clock, Key } from 'lucide-react';
import { analyzeEvidenceApi } from '../services/aiApi';

const EvidenceAnalysis: React.FC = () => {
  const { evidenceId } = useParams();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiError, setAiError] = useState('');
  const [activeTab, setActiveTab] = useState('visao-geral');

  const allEvidences = [
    { id: 'fireplace', type: 'Documento', title: 'Carta Anônima', content: 'Vocês pensam que sabem a verdade...', date: '12/05', image: '/backgrounds/ev_letter.png' },
    { id: 'armchair', type: 'Item', title: 'Chave do quarto 7', content: 'Uma chave de metal dourada.', date: '12/05', image: '/backgrounds/ev_key_7.png' },
    { id: 'window', type: 'Foto', title: 'Foto da Família', content: 'Retrato antigo rasgado.', date: '13/05', image: '/backgrounds/ev_photo.png' },
    { id: 'table', type: 'Documento', title: 'Diário de Elisa', content: 'Anotações perturbadoras.', date: '14/05', image: '/backgrounds/ev_diary.png' },
    { id: 'blood', type: 'Vestígio', title: 'Mancha de Sangue', content: 'Traços orgânicos escuros.', date: '15/05', image: '/backgrounds/ev_blood.png' },
  ];

  const mockEvidence = allEvidences.find(e => e.id === evidenceId) || allEvidences[0];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiError('');
    try {
      const result = await analyzeEvidenceApi({
        evidenceId: mockEvidence.id,
        title: mockEvidence.title,
        desc: mockEvidence.content,
        type: mockEvidence.type
      });
      setAiReport({ summary: result, confidence: 78 });
    } catch (err) {
      setAiError('Falha no link de dados forenses.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Imagem de Fundo e Gradiente */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '55vh',
        backgroundImage: `url(${mockEvidence.image})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
      }} />
      {/* Fade para mesclar com o conteúdo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '55vh',
        background: 'linear-gradient(180deg, rgba(10,13,16,0) 0%, rgba(10,13,16,0.1) 50%, rgba(10,13,16,0.9) 90%, #0A0D10 100%)', zIndex: 1
      }} />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 2, padding: '48px 24px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F8F9FA', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={24} />
        </button>
      </header>

      {/* Título da Evidência */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 24px', marginTop: '20px' }}>
        <span style={{ color: '#C5A880', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Análise de Evidências</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', margin: '8px 0', color: '#F8F9FA', fontWeight: 400 }}>{mockEvidence.title}</h1>
        <p style={{ color: '#8E989F', fontSize: '13px', margin: 0 }}>Encontrada em {mockEvidence.date} às 14:32</p>
        
        <button 
          onClick={!aiReport ? handleAnalyze : undefined}
          disabled={analyzing}
          style={{ 
            marginTop: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(197, 168, 128, 0.3)', color: '#C5A880', 
            padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
            cursor: analyzing ? 'not-allowed' : 'pointer', opacity: analyzing ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '1px'
          }}
        >
          <Brain size={14} /> 
          {analyzing ? 'Analisando amostras...' : aiReport ? 'Análise Concluída' : 'Solicitar Análise da IA'}
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, marginTop: '40px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 24px', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', WebkitOverflowScrolling: 'touch' }}>
          {['visão geral', 'análise da ia', 'conexões', 'detalhes técnicos'].map((tab) => (
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

        {/* Content */}
        <div style={{ padding: '0 24px 100px 24px' }}>
          
          {aiError && (
            <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '24px', fontSize: '13px' }}>
              {aiError}
            </div>
          )}

          {aiReport && activeTab === 'visão geral' && (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              
              {/* Resumo da Análise */}
              <div style={{ backgroundColor: '#13191C', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880', marginBottom: '16px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <Brain size={16} /> Resumo da Análise
                </div>
                
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ color: '#F8F9FA', fontSize: '14px', lineHeight: 1.6, flex: 1 }}>
                    {aiReport.summary.substring(0, 150)}...
                  </div>
                  
                  {/* Círculo de relevância */}
                  <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '4px solid rgba(197,168,128,0.2)', borderTopColor: '#C5A880' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#F8F9FA', fontSize: '20px', fontWeight: 600 }}>78%</div>
                      <div style={{ color: '#8E989F', fontSize: '9px', textTransform: 'uppercase' }}>Relevância</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* O que a IA Identificou */}
              <div style={{ backgroundColor: '#13191C', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880', marginBottom: '24px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <Search size={16} /> O que a IA identificou
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}><Fingerprint size={20} /></div>
                    <div>
                      <div style={{ color: '#F8F9FA', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Impressões digitais parciais</div>
                      <div style={{ color: '#8E989F', fontSize: '12px' }}>Possível correspondência com Rafael Blackwell</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}><Clock size={20} /></div>
                    <div>
                      <div style={{ color: '#F8F9FA', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Uso recente</div>
                      <div style={{ color: '#8E989F', fontSize: '12px' }}>Resíduos de óleo indicam uso nas últimas 24h</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}><Key size={20} /></div>
                    <div>
                      <div style={{ color: '#F8F9FA', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Pertence à Blackwell House</div>
                      <div style={{ color: '#8E989F', fontSize: '12px' }}>Compatível com fechaduras do segundo andar</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hipótese */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880', marginBottom: '12px', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <Brain size={14} /> Hipótese da IA
                </div>
                <div style={{ background: 'transparent', color: '#F8F9FA', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.6 }}>
                  "{aiReport.summary}"
                </div>
              </div>
              
            </div>
          )}

          {!aiReport && !analyzing && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E989F' }}>
              <p style={{ fontSize: '14px' }}>Nenhum dado forense extraído ainda.</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Clique em "Solicitar Análise da IA" no topo para investigar esta pista.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EvidenceAnalysis;
