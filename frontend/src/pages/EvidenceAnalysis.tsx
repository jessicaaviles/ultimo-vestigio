import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Brain, Search, Fingerprint, Clock, Key } from 'lucide-react';
import { analyzeEvidenceApi } from '../services/aiApi';

const EvidenceAnalysis: React.FC = () => {
  const { evidenceId } = useParams();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  const mockDatabase: Record<string, any> = {
    'window': {
      id: 'window',
      title: 'Janela Entreaberta',
      type: 'Cena do Crime',
      date: '12 Mai',
      image: '/backgrounds/ev_photo.png',
      desc: 'A janela principal da sala de estar foi encontrada escancarada, com o vento noturno soprando as cortinas.',
      notes: [
        'A trava da janela está perfeitamente intacta, sem sinais de arrombamento externo.',
        'Quem quer que tenha aberto a janela, fez isso por dentro, e com muita calma.',
        'Curiosamente, não há pegadas de lama ou sujeira no tapete persa logo abaixo.'
      ],
      conclusion: 'A cena sugere que a fuga ou invasão foi encenada de dentro para fora.',
      tags: ['Inconsistência', 'Encenação']
    },
    'armchair': {
      id: 'armchair',
      title: 'Poltrona Revirada',
      type: 'Cena do Crime',
      date: '12 Mai',
      image: '/backgrounds/scene_living_room.png',
      desc: 'Uma pesada poltrona de mogno está tombada no chão da sala de estar.',
      notes: [
        'A poltrona sugere uma luta brutal no local.',
        'No entanto, a mesinha de centro de vidro ao lado dela e os vasos caros estão perfeitamente intactos.',
        'Uma briga real e imprevisível quase certamente teria quebrado os objetos frágeis próximos.'
      ],
      conclusion: 'Assim como a janela, a poltrona parece ter sido derrubada intencionalmente para simular um confronto.',
      tags: ['Inconsistência', 'Cena Montada']
    },
    'table': {
      id: 'table',
      title: 'Carta Anônima',
      type: 'Documento',
      date: '12 Mai',
      image: '/backgrounds/ev_letter.png',
      desc: 'Uma nota rabiscada deixada sobre a mesa de centro. Diz: "Vocês pensam que sabem a verdade. Mas a casa guarda o que vocês preferem esquecer. Pagará pelo que fez a Elisa."',
      notes: [
        'A caligrafia agressiva tenta imitar a letra cursiva característica do Sr. Tomás Blackwell.',
        'A tinta é de uma caneta-tinteiro edição limitada francesa (Montblanc Rouge).',
        'Clara Mendes é conhecida por colecionar e escrever exclusivamente com canetas-tinteiro europeias.'
      ],
      conclusion: 'A carta não foi uma ameaça externa. Clara escreveu a nota para incriminar a família antes de sumir.',
      tags: ['Premeditação', 'Falsificação', 'Vingança']
    },
    'fireplace': {
      id: 'fireplace',
      title: 'Restos na Lareira',
      type: 'Vestígio',
      date: '12 Mai',
      image: '/backgrounds/ev_diary.png',
      desc: 'Cinzas frias na lareira contêm um fragmento de papel parcialmente preservado.',
      notes: [
        'O fogo foi apagado antes de consumir tudo.',
        'O fragmento mostra o logo da "Aerolíneas Del Sur".',
        'É parte de uma passagem só de ida para Buenos Aires, comprada no nome de "C.M." para a manhã seguinte ao crime.'
      ],
      conclusion: 'Por que alguém que foi sequestrado teria comprado uma passagem internacional de fuga antecipadamente?',
      tags: ['Fuga', 'Premeditação']
    },
    'blood': {
      id: 'blood',
      title: 'Mancha de Sangue',
      type: 'Vestígio Biológico',
      date: '12 Mai',
      image: '/backgrounds/ev_blood.png',
      desc: 'Uma grande mancha de sangue no tapete, quase invisível a olho nu na escuridão, mas brilhante sob a luz UV.',
      notes: [
        'O padrão espirrado é muito artificial, concentrado em um único círculo perfeito.',
        'Não há respingos satélites, típicos de sangramento por ferimento ou impacto.',
        'Análise laboratorial revelou altíssima concentração de anticoagulantes sintéticos (usados em sangue cenográfico ou de transfusão).'
      ],
      conclusion: 'O sangue foi derramado deliberadamente de um recipiente. Ninguém foi ferido aqui.',
      tags: ['Fraude Biológica', 'Pista Falsa']
    }
  };

  const mockEvidence = mockDatabase[evidenceId as string] || mockDatabase['armchair'];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setTimeout(async () => {
      try {
        const result = await analyzeEvidenceApi({ 
          evidenceId: mockEvidence.id,
          title: mockEvidence.title,
          desc: mockEvidence.desc,
          type: mockEvidence.type
        });
        setAiReport(result);
      } catch (err) {
        setAiReport({
          summary: "A chave foi encontrada na sala de estar, próxima ao corpo de Helena. Há marcas de desgaste compatíveis com uso recente. Impressões digitais parciais identificadas.",
          relevance: 78,
          findings: [
            { icon: <Fingerprint size={16} />, title: "Impressões digitais parciais", desc: "Possível correspondência com Rafael Blackwell" },
            { icon: <Clock size={16} />, title: "Uso recente", desc: "Resíduos de óleo e microarranhões indicam uso nas últimas 24h" },
            { icon: <Key size={16} />, title: "Pertence à Mansão Blackwell", desc: "Compatível com as fechaduras dos quartos do segundo andar" }
          ]
        });
      } finally {
        setAnalyzing(false);
      }
    }, 2000);
  };

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      
      {/* Imagem da Evidência (Background) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh',
        backgroundImage: `url(${mockEvidence.image})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
      }} />
      {/* Fade para mesclar com o conteúdo e máscara 10% */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh',
        background: 'linear-gradient(180deg, rgba(10,13,16,0.1) 0%, rgba(10,13,16,0.1) 50%, rgba(10,13,16,0.95) 90%, #0A0D10 100%)', zIndex: 1
      }} />

      {/* Título da Evidência (Abaixo da Imagem, sem Box Transparente) */}
      <div style={{ padding: '0 24px', marginTop: '30vh', position: 'relative', zIndex: 2 }}>
        <span style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Análise de Evidências</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '8px 0', color: '#F8F9FA', fontWeight: 400 }}>{mockEvidence.title}</h1>
        <p style={{ color: '#8E989F', fontSize: '13px', margin: '0 0 16px 0' }}>Encontrada em {mockEvidence.date} às 14:32</p>
        <p style={{ color: '#E8EAED', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0', fontStyle: 'italic', borderLeft: '2px solid rgba(197, 168, 128, 0.5)', paddingLeft: '12px' }}>
          "{mockEvidence.desc}"
        </p>
        <button 
          onClick={!aiReport ? handleAnalyze : undefined}
          disabled={analyzing}
          style={{ 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(197, 168, 128, 0.3)', color: '#C5A880', 
            padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
            cursor: analyzing ? 'not-allowed' : 'pointer', opacity: analyzing ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '1px'
          }}
        >
          <Brain size={14} /> 
          {analyzing ? 'Analisando amostras...' : aiReport ? 'Análise Concluída' : 'Solicitar Análise da IA'}
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, marginTop: '40px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 24px', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', WebkitOverflowScrolling: 'touch' }}>
          {['visão geral', 'análise da ia', 'conexões', 'detalhes técnicos'].map((tab) => {
            const tabId = tab.replace(/ /g, '-').replace('ã', 'a').replace('á', 'a').replace('é', 'e');
            return (
              <button 
                key={tabId} 
                onClick={() => setActiveTab(tabId)}
                style={{ 
                  background: 'none', border: 'none', padding: '0 0 16px 0', color: activeTab === tabId ? '#C5A880' : '#8E989F',
                  fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap',
                  borderBottom: activeTab === tabId ? '2px solid #C5A880' : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'visao-geral' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                    <Search size={14} /> Resumo da Análise
                  </div>
                  <p style={{ color: '#E8EAED', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                    {aiReport ? aiReport.summary : 'Solicite a análise da IA para revelar as características ocultas desta evidência. A inteligência artificial examinará marcas, resíduos e cruzará dados com o banco de informações da Mansão Blackwell.'}
                  </p>
                </div>
                
                {aiReport && (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid rgba(197, 168, 128, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: '24px', flexShrink: 0 }}>
                    <span style={{ color: '#F8F9FA', fontSize: '18px', fontWeight: 700 }}>{aiReport.relevance}%</span>
                    <span style={{ color: '#C5A880', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Relevância</span>
                  </div>
                )}
              </div>

              {aiReport && (
                <>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '24px 0' }} />
                  <div style={{ color: '#C5A880', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={14} /> O que a IA identificou
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {aiReport.findings.map((finding: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}>
                          {finding.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{finding.title}</div>
                          <div style={{ color: '#8E989F', fontSize: '12px' }}>{finding.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab !== 'visao-geral' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ color: '#C5A880', fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>?</div>
              <h3 style={{ color: '#F8F9FA', fontSize: '18px', marginBottom: '8px' }}>Conteúdo Indisponível</h3>
              <p style={{ color: '#8E989F', fontSize: '13px' }}>
                Os dados da guia "{activeTab.replace('-', ' ')}" estão bloqueados nesta fase da investigação. Continue coletando pistas para liberar mais informações.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EvidenceAnalysis;
