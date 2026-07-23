import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, Search, Fingerprint, Clock, Key, ChevronRight, Share2, Plus, Sparkles, Fullscreen, MessageSquare, ArrowLeft } from 'lucide-react';

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="70" height="70" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx="35" cy="35" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle cx="35" cy="35" r={radius} fill="transparent" stroke="#C5A880" strokeWidth="3" 
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#F8F9FA', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>{percentage}%</div>
        <div style={{ color: '#8E989F', fontSize: '7px', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>Relevância<br/>Alta</div>
      </div>
    </div>
  );
};

const EvidenceAnalysis: React.FC = () => {
  const { evidenceId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Detalhes');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Mock Database Enriquecido
  const mockDatabase: Record<string, any> = {
    'window': {
      id: 'window', title: 'Janela Entreaberta', type: 'Cena do Crime', date: '12 Mai', image: '/backgrounds/scene_living_room.png',
      desc: 'A janela principal da sala de estar foi encontrada escancarada, com o vento noturno soprando as cortinas.',
      aiAnalysis: 'A trava da janela está perfeitamente intacta, sem sinais de arrombamento externo. Quem quer que tenha aberto a janela, fez isso por dentro, e com muita calma. Curiosamente, não há pegadas de lama ou sujeira no tapete persa logo abaixo.',
      hypothesis: 'A cena sugere que a fuga ou invasão foi encenada de dentro para fora. Houve premeditação.',
      relevance: 35,
      findings: [
        { icon: <Search size={16} />, title: "Trava Intacta", desc: "Sem ranhuras típicas de arrombamento." },
        { icon: <Fingerprint size={16} />, title: "Falta de vestígios", desc: "Ausência de pegadas indica que ninguém entrou por aqui." }
      ],
      connections: [
        { type: "Local", name: "Jardim Frontal", subtitle: "Abaixo da janela", image: "https://images.unsplash.com/photo-1558904541-efa843a96f09?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: []
    },
    'armchair': {
      id: 'armchair', title: 'Poltrona Revirada', type: 'Cena do Crime', date: '12 Mai', image: '/backgrounds/scene_living_room.png',
      desc: 'Uma pesada poltrona de mogno está tombada no chão da sala de estar.',
      aiAnalysis: 'A poltrona sugere uma luta brutal no local. No entanto, a mesinha de centro de vidro ao lado dela e os vasos caros estão perfeitamente intactos. Uma briga real e imprevisível quase certamente teria quebrado os objetos frágeis próximos.',
      hypothesis: 'Assim como a janela, a poltrona parece ter sido derrubada intencionalmente para simular um confronto.',
      relevance: 30,
      findings: [
        { icon: <Search size={16} />, title: "Padrão de Queda", desc: "Força calculada, não caótica." },
        { icon: <Search size={16} />, title: "Objetos Intactos", desc: "Vidros a centímetros de distância não foram afetados." }
      ],
      connections: [
        { type: "Pista Relacionada", name: "Janela Entreaberta", subtitle: "Parte da mesma encenação", image: "/backgrounds/scene_living_room.png" }
      ],
      discussion: []
    },
    'table': {
      id: 'table', title: 'Carta Anônima', type: 'Documento', date: '12 Mai', image: '/backgrounds/ev_letter.png',
      desc: 'Uma nota rabiscada deixada sobre a mesa de centro.',
      transcription: "Vocês pensam que sabem a verdade.\nMas a casa guarda o que vocês\npreferem esquecer.\nPagará pelo que fez a Elisa.",
      aiAnalysis: "A caligrafia agressiva tenta imitar a letra cursiva característica do Sr. Tomás Blackwell. A tinta é de uma caneta-tinteiro edição limitada francesa (Montblanc Rouge). Clara Mendes é conhecida por colecionar e escrever exclusivamente com canetas-tinteiro europeias.",
      hypothesis: "A carta não foi uma ameaça externa. Clara escreveu a nota para incriminar a família antes de sumir.",
      relevance: 82,
      findings: [
        { icon: <Sparkles size={16} />, title: "Análise Grafotécnica", desc: "A caligrafia tenta imitar a letra de Tomás." },
        { icon: <Clock size={16} />, title: "Tinta Montblanc Rouge", desc: "Tinta de luxo, ligada a Clara Mendes." }
      ],
      connections: [
        { type: "Suspeito", name: "Clara Mendes", subtitle: "Possui canetas Montblanc", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
        { type: "Suspeito", name: "Tomás Blackwell", subtitle: "Assinatura falsificada", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: [
        { user: "Helena", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop", message: "A caligrafia parece masculina. Concordam?", time: "Hoje às 09:41" }
      ]
    },
    'fireplace': {
      id: 'fireplace', title: 'Restos na Lareira', type: 'Vestígio', date: '12 Mai', image: '/backgrounds/ev_matches.png?v=11',
      desc: 'Cinzas frias na lareira contêm um fragmento de papel parcialmente preservado.',
      aiAnalysis: 'O fogo foi apagado antes de consumir tudo. O fragmento mostra o logo da "Aerolíneas Del Sur". É parte de uma passagem só de ida para Buenos Aires, comprada no nome de "C.M." para a manhã seguinte ao crime.',
      hypothesis: 'A vítima planejava uma viagem, possivelmente uma fuga premeditada.',
      relevance: 95,
      findings: [
        { icon: <Search size={16} />, title: "Passagem Aérea", desc: "Aerolíneas Del Sur para Buenos Aires." },
        { icon: <Clock size={16} />, title: "Fogo Interrompido", desc: "Tentativa falha de destruição de provas." }
      ],
      connections: [
        { type: "Suspeito", name: "Clara Mendes", subtitle: "Iniciais 'C.M.'", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: []
    },
    'blood': {
      id: 'blood', title: 'Sangue Artificial', type: 'Vestígio Biológico', date: '12 Mai', image: '/backgrounds/ev_receipt.png?v=11',
      desc: 'Uma grande mancha de sangue no tapete, brilhante sob a luz UV.',
      aiAnalysis: 'O padrão espirrado é muito artificial. Análise revelou altíssima concentração de anticoagulantes sintéticos (usados em sangue cenográfico).',
      hypothesis: 'O sangue foi derramado deliberadamente para forjar uma agressão. Ninguém foi ferido aqui.',
      relevance: 25,
      findings: [
        { icon: <Sparkles size={16} />, title: "Composição Química", desc: "Anticoagulantes sintéticos." },
        { icon: <Fingerprint size={16} />, title: "Padrão de Dispersão", desc: "Derramado, não espirrado de uma ferida." }
      ],
      connections: [],
      discussion: []
    },
    'wine_glass': {
      id: 'wine_glass', title: 'Taça Quebrada', type: 'Objeto', date: '12 Mai', image: '/backgrounds/ev_glass.png?v=11',
      desc: 'Cacos de uma taça de vinho espalhados pelo chão.',
      aiAnalysis: 'Não há sangue ou tecido nos cacos. O padrão de estilhaçamento indica queda livre acidental.',
      hypothesis: 'Um acidente irrelevante para o caso. O mordomo relatou ter derrubado uma bandeja.',
      relevance: 10,
      findings: [
        { icon: <Search size={16} />, title: "Limpo", desc: "Sem traços biológicos." }
      ],
      connections: [],
      discussion: []
    },
    'desk_letter': {
      id: 'desk_letter', title: 'Carta de Helena', type: 'Documento', date: '12 Mai', image: '/backgrounds/ev_ledger.png?v=11',
      desc: 'Uma carta escondida debaixo de alguns livros na escrivaninha da biblioteca.',
      transcription: "Ele descobriu.\nVocê precisa sair da casa hoje à noite.\n- H",
      aiAnalysis: 'Endereçada a Clara. A caligrafia é apressada, indicando forte estresse emocional no momento da escrita. A assinatura "H" bate perfeitamente com a grafia de Helena.',
      hypothesis: 'Helena estava ajudando Clara a fugir e atuava como cúmplice interna.',
      relevance: 88,
      findings: [
        { icon: <Sparkles size={16} />, title: "Grafologia", desc: "Escrita sob estresse. Autoria de Helena." }
      ],
      connections: [
        { type: "Vítima", name: "Helena", subtitle: "Autora do aviso", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
        { type: "Suspeito", name: "Clara Mendes", subtitle: "Destinatária", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: []
    },
    'safe': {
      id: 'safe', title: 'Cofre Oculto', type: 'Local', date: '12 Mai', image: '/backgrounds/ev_safe.png?v=11',
      desc: 'Um cofre atrás de um quadro na biblioteca.',
      aiAnalysis: 'Está trancado. As dobradiças estão oxidadas. Marcas de poeira consistentes indicam que não é aberto há pelo menos três anos.',
      hypothesis: 'Vazio ou irrelevante. Uma distração para a investigação.',
      relevance: 15,
      findings: [
        { icon: <Clock size={16} />, title: "Inativo", desc: "Poeira intocada por anos." }
      ],
      connections: [],
      discussion: []
    },
    'cigar': {
      id: 'cigar', title: 'Charuto Apagado', type: 'Vestígio', date: '12 Mai', image: '/backgrounds/ev_cigar.png?v=11',
      desc: 'Um charuto pela metade no cinzeiro da biblioteca.',
      aiAnalysis: 'Restos de cinza indicam uma marca cubana barata. Tomás Blackwell não fuma charutos. O ressecamento das folhas sugere que foi deixado aí há mais de uma semana.',
      hypothesis: 'Deixado por um visitante dias atrás. Sem relação direta com o incidente principal.',
      relevance: 20,
      findings: [
        { icon: <Search size={16} />, title: "Idade", desc: "Abandonado há mais de 7 dias." }
      ],
      connections: [],
      discussion: []
    },
    'mirror_msg': {
      id: 'mirror_msg', title: 'Mensagem no Espelho', type: 'Pista Oculta', date: '12 Mai', image: '/backgrounds/ev_mirror.png?v=11',
      desc: 'Sob luz UV, palavras rabiscadas aparecem no espelho do quarto.',
      transcription: "O jardim esconde a verdade",
      aiAnalysis: 'Escrita com tinta invisível à base de reagentes cítricos. A altura da escrita é compatível com uma pessoa de 1.65m.',
      hypothesis: 'Um recado deixado propositalmente por Clara ou Helena para quem viesse investigar, guiando-os para fora da casa.',
      relevance: 90,
      findings: [
        { icon: <Sparkles size={16} />, title: "Tinta Invisível", desc: "Reagente natural (limão/ácido)." }
      ],
      connections: [
        { type: "Local", name: "Jardim Frontal", subtitle: "Local mencionado", image: "https://images.unsplash.com/photo-1558904541-efa843a96f09?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: []
    },
    'suitcase': {
      id: 'suitcase', title: 'Mala Semi-Pronta', type: 'Objeto', date: '12 Mai', image: '/backgrounds/ev_suitcase.png?v=11',
      desc: 'Uma mala no chão do quarto, cheia de roupas pesadas de inverno.',
      aiAnalysis: 'Contém roupas térmicas e casacos grossos de neve. No entanto, a passagem secreta de Clara é para Buenos Aires, que está no pico do verão sul-americano. As roupas possuem etiquetas não cortadas.',
      hypothesis: 'Foi preparada deliberadamente para enganar investigadores sobre o destino real da fuga.',
      relevance: 45,
      findings: [
        { icon: <Search size={16} />, title: "Roupas Novas", desc: "Etiquetas ainda presas." },
        { icon: <Search size={16} />, title: "Inconsistência Climática", desc: "Incompatível com o destino da passagem." }
      ],
      connections: [
        { type: "Pista Relacionada", name: "Restos na Lareira", subtitle: "Contradição de destino", image: "/backgrounds/ev_matches.png" }
      ],
      discussion: []
    },
    'pills': {
      id: 'pills', title: 'Vidro de Remédios', type: 'Vestígio', date: '12 Mai', image: '/backgrounds/ev_pills.png?v=11',
      desc: 'Um frasco de calmantes fortes na mesa de cabeceira.',
      aiAnalysis: 'Prescritos legalmente para Clara Mendes. O frasco está quase cheio e não há traços de dosagem letal nos arredores. O lote é recente.',
      hypothesis: 'Apenas medicação de rotina, sem relevância letal para o caso.',
      relevance: 18,
      findings: [
        { icon: <Search size={16} />, title: "Receita Válida", desc: "No nome de Clara Mendes." }
      ],
      connections: [],
      discussion: []
    },
    'fountain': {
      id: 'fountain', title: 'Livro-caixa Desenterrado', type: 'Documento', date: '12 Mai', image: '/backgrounds/ev_fountain.png?v=11',
      desc: 'Um livro contábil meio queimado, escondido na fonte de pedra do jardim.',
      aiAnalysis: 'As páginas recuperadas mostram tabelas de transações offshore milionárias. Há anotações nas margens com a letra confirmada de Clara Mendes que dizem: "É o suficiente para destruí-lo".',
      hypothesis: 'Este é o motivo central. Clara descobriu os esquemas de lavagem de dinheiro de Tomás Blackwell e o chantageou antes de arquitetar sua fuga.',
      relevance: 99,
      findings: [
        { icon: <Search size={16} />, title: "Fraude Financeira", desc: "Contas offshore em paraísos fiscais." },
        { icon: <Sparkles size={16} />, title: "Chantagem", desc: "Anotações marginais incriminadoras." }
      ],
      connections: [
        { type: "Suspeito", name: "Tomás Blackwell", subtitle: "Titular das contas", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
        { type: "Suspeito", name: "Clara Mendes", subtitle: "Chantagista", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: []
    },
    'mud': {
      id: 'mud', title: 'Pegadas Duplas', type: 'Vestígio', date: '12 Mai', image: '/backgrounds/ev_mud.png?v=11',
      desc: 'Na lama perto do portão, duas trilhas de passos se afastam da casa.',
      aiAnalysis: 'Os moldes indicam um par de sapatos de salto alto (tamanho 37, correspondente a Clara) e um par de botas rasteiras (tamanho 35, correspondente a Helena). O ritmo da passada é cadenciado e sem corrida.',
      hypothesis: 'Clara e Helena saíram caminhando juntas pelos fundos. Confirmando a cumplicidade na fuga.',
      relevance: 92,
      findings: [
        { icon: <Fingerprint size={16} />, title: "Sapatos Múltiplos", desc: "Saltos e botas identificados." },
        { icon: <Search size={16} />, title: "Caminhada Calma", desc: "Sem sinais de pânico ou corrida." }
      ],
      connections: [
        { type: "Suspeito", name: "Clara Mendes", subtitle: "Saltos (Tamanho 37)", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
        { type: "Vítima", name: "Helena", subtitle: "Botas (Tamanho 35)", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" }
      ],
      discussion: []
    },
    'animal_bones': {
      id: 'animal_bones', title: 'Ossos Pequenos', type: 'Vestígio Biológico', date: '12 Mai', image: '/backgrounds/ev_bones.png?v=11',
      desc: 'Alguns ossos desenterrados perto do portão.',
      aiAnalysis: 'A estrutura óssea é incompatível com humanos e muito porosa, indicando anos de soterramento. Fragmentos de uma coleira de couro velho gravada com o nome "Buster" foram achados junto.',
      hypothesis: 'São apenas os restos do antigo cachorro da família, enterrado há mais de uma década. Totalmente irrelevante.',
      relevance: 5,
      findings: [
        { icon: <Search size={16} />, title: "Não-Humano", desc: "Morfologia canina." }
      ],
      connections: [],
      discussion: []
    }
  };

  const defaultMock = {
    id: evidenceId, title: 'Evidência Ficheiro ' + evidenceId, type: 'Cena do Crime', date: '12 Mai', image: '/backgrounds/ev_photo.png',
    desc: 'Um objeto encontrado na cena principal com várias peculiaridades.',
    relevance: 78,
    hypothesis: "Há uma forte possibilidade de que o suspeito tenha estado no quarto 7 pouco antes do crime. Recomendamos investigar o álibi de Rafael Blackwell no período entre 20h e 22h.",
    findings: [
      { icon: <Fingerprint size={16} />, title: "Impressões digitais parciais", desc: "Possível correspondência com Rafael Blackwell" },
      { icon: <Clock size={16} />, title: "Uso recente", desc: "Resíduos de óleo e microarranhões indicam uso nas últimas 24h" },
      { icon: <Key size={16} />, title: "Pertence à Blackwell House", desc: "Compatível com as fechaduras dos quartos do segundo andar" }
    ],
    connections: [
      { type: "Vítima", name: "Helena", subtitle: "Encontrada a 2m do corpo", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
      { type: "Local", name: "Quarto 7", subtitle: "Porta estava trancada", image: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?q=80&w=200&auto=format&fit=crop" },
      { type: "Suspeito", name: "Rafael Blackwell", subtitle: "Impressões parciais", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" }
    ],
    aiAnalysis: "A chave foi encontrada na sala de estar, próxima ao corpo de Helena. Há marcas de desgaste compatíveis com uso recente.",
    discussion: []
  };

  const mockEvidence = mockDatabase[evidenceId as string] || mockDatabase['table'] || defaultMock;

  useEffect(() => {
    if (localStorage.getItem(`analyzed_${evidenceId}`)) {
      setAiReport(mockEvidence);
    } else {
      setAiReport(null);
    }
  }, [evidenceId, mockEvidence]);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAiReport(mockEvidence);
      setAnalyzing(false);
      localStorage.setItem(`analyzed_${evidenceId}`, 'true');
      setActiveTab('Análise da IA');
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: '#0A0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', paddingBottom: '100px' }}>
      
      {/* Imagem da Evidência (Background) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh',
        backgroundImage: `url(${mockEvidence.image})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh',
        background: 'linear-gradient(180deg, rgba(10,13,16,0.1) 0%, rgba(10,13,16,0.3) 50%, rgba(10,13,16,1) 95%, #0A0D10 100%)', zIndex: 1
      }} />

      {/* Header com Voltar */}
      <div style={{ position: 'relative', zIndex: 2, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F8F9FA', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={20} />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Voltar</span>
        </button>
      </div>

      {/* Título da Evidência */}
      <div style={{ padding: '0 24px', marginTop: '15vh', position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '0 0 16px 0', color: '#F8F9FA', fontWeight: 400 }}>{mockEvidence.title}</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, marginTop: '24px' }}>
          
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 24px', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {['Detalhes', 'Análise da IA', 'Conexões', 'Discussão'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ 
                background: 'none', border: 'none', padding: '0 0 16px 0', color: activeTab === tab ? '#C5A880' : '#8E989F',
                fontSize: '12px', fontWeight: activeTab === tab ? 600 : 500, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: activeTab === tab ? '2px solid #C5A880' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {activeTab === 'Detalhes' && (
            <>
              {/* Descrição Principal */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '16px' }}>Descrição</div>
                <p style={{ color: '#E8EAED', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                  {mockEvidence.desc}
                </p>
              </div>

              {/* Transcrição */}
              {mockEvidence.transcription && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '16px' }}>Transcrição</div>
                  <div style={{ color: '#C5A880', fontSize: '40px', fontFamily: 'var(--font-serif)', lineHeight: 0.5, marginBottom: '16px', opacity: 0.5 }}>"</div>
                  <p style={{ color: '#E8EAED', fontSize: '15px', fontFamily: 'monospace', lineHeight: 1.6, margin: '0 0 16px 0', whiteSpace: 'pre-line' }}>
                    {mockEvidence.transcription}
                  </p>
                  <div style={{ color: '#C5A880', fontSize: '40px', fontFamily: 'var(--font-serif)', lineHeight: 0.5, marginBottom: '24px', opacity: 0.5 }}>"</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8F9FA', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                      <Fullscreen size={14} /> Ver original
                    </button>
                  </div>
                </div>
              )}

              {/* Análise da IA Resumo */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '16px' }}>Análise da IA</div>
                {!aiReport ? (
                  <button 
                    onClick={handleAnalyze} disabled={analyzing}
                    style={{ 
                      background: 'linear-gradient(90deg, rgba(197, 168, 128, 0.1) 0%, rgba(197, 168, 128, 0.05) 100%)', border: '1px solid rgba(197, 168, 128, 0.3)', color: '#C5A880', 
                      padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: analyzing ? 'not-allowed' : 'pointer', opacity: analyzing ? 0.7 : 1, width: '100%', justifyContent: 'center'
                    }}
                  >
                    <Brain size={16} /> 
                    {analyzing ? 'Analisando amostras...' : 'Solicitar Análise da IA'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(197, 168, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A880', flexShrink: 0 }}>
                      <Sparkles size={20} />
                    </div>
                    <p style={{ color: '#8E989F', fontSize: '14px', lineHeight: 1.5, margin: 0, flex: 1 }}>
                      {mockEvidence.aiAnalysis}
                    </p>
                    <ChevronRight size={16} color="#8E989F" />
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'Análise da IA' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
              {!aiReport ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Brain size={48} color="#C5A880" style={{ opacity: 0.5, marginBottom: '24px' }} />
                  <h3 style={{ color: '#F8F9FA', fontSize: '18px', marginBottom: '8px', fontWeight: 400 }}>Análise Pendente</h3>
                  <p style={{ color: '#8E989F', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
                    A Inteligência Artificial ainda não examinou esta pista. Solicite a análise para revelar conexões ocultas, impressões digitais e hipóteses.
                  </p>
                  <button 
                    onClick={handleAnalyze} disabled={analyzing}
                    style={{ 
                      background: 'linear-gradient(90deg, #A88B63 0%, #C5A880 100%)', border: 'none', color: '#0A0D10', 
                      padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px',
                      cursor: analyzing ? 'not-allowed' : 'pointer', opacity: analyzing ? 0.7 : 1
                    }}
                  >
                    <Sparkles size={16} /> 
                    {analyzing ? 'Analisando...' : 'Iniciar Escaneamento'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div style={{ flex: 1, paddingRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                      <Search size={14} /> Resumo da Análise
                    </div>
                    <p style={{ color: '#E8EAED', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                      {mockEvidence.aiAnalysis}
                    </p>
                  </div>
                  <CircularProgress percentage={mockEvidence.relevance} />
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '24px 0' }} />
                
                <div style={{ color: '#C5A880', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={14} /> O que a IA identificou
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {mockEvidence.findings.map((finding: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E989F' }}>
                        {finding.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#F8F9FA', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{finding.title}</div>
                        <div style={{ color: '#8E989F', fontSize: '12px' }}>{finding.desc}</div>
                      </div>
                      <ChevronRight size={16} color="#4A5568" />
                    </div>
                  ))}
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '24px 0' }} />
                
                <div style={{ color: '#C5A880', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} /> Hipótese da IA
                </div>
                <p style={{ color: '#E8EAED', fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 24px 0' }}>
                  "{mockEvidence.hypothesis}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: 'rgba(197, 168, 128, 0.1)', border: '1px solid rgba(197, 168, 128, 0.2)', color: '#C5A880', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                    Ver detalhes da hipótese <ChevronRight size={14} />
                  </button>
                </div>
              </>
              )}
            </div>
          )}

            {activeTab === 'Conexões' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mockEvidence.connections.map((conn: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#1A202C', flexShrink: 0 }}>
                      <img src={conn.image} alt={conn.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#8E989F', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{conn.type}</div>
                      <div style={{ color: '#F8F9FA', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{conn.name}</div>
                      <div style={{ color: '#8E989F', fontSize: '13px' }}>{conn.subtitle}</div>
                    </div>
                    <ChevronRight size={16} color="#8E989F" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Discussão' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ color: '#C5A880', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '24px' }}>Discussão da Equipe</div>
                {mockEvidence.discussion.map((disc: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <img src={disc.avatar} alt={disc.user} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 600 }}>{disc.user}</span>
                        <span style={{ color: '#8E989F', fontSize: '11px' }}>{disc.time}</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '0 12px 12px 12px', color: '#E8EAED', fontSize: '14px' }}>
                        {disc.message}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', color: '#8E989F', fontSize: '12px' }}>
                      <MessageSquare size={12} /> 3
                    </div>
                  </div>
                ))}
                {mockEvidence.discussion.length === 0 && (
                  <div style={{ color: '#8E989F', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nenhuma discussão iniciada.</div>
                )}
              </div>
            )}
            
          </div>
        </div>

      {/* Sticky Bottom Bar */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '16px 24px',
        background: 'rgba(10,13,16,0.85)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', gap: '16px', zIndex: 10
      }}>
        <button style={{ flex: 1, background: 'linear-gradient(90deg, #A88B63 0%, #C5A880 100%)', border: 'none', borderRadius: '12px', padding: '16px', color: '#0A0D10', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
          Adicionar à linha do tempo <Plus size={16} />
        </button>
        <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '54px', height: '54px', color: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Share2 size={20} />
        </button>
      </div>

    </div>
  );
};

export default EvidenceAnalysis;
