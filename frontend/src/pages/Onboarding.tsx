import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, FileSearch, MessageSquareQuote, Users, WandSparkles } from 'lucide-react';
import { completeOnboarding } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const steps = [
  {
    icon: FileSearch,
    title: 'Observe antes de perguntar',
    text: 'Leia o caso, os nomes citados e as pistas abertas. Quanto mais específico você for, melhor o Mestre responde.'
  },
  {
    icon: MessageSquareQuote,
    title: 'Entenda os quatro tipos de resposta',
    text: 'Sim, Não, Parcialmente e Desconhecido existem para manter a investigação justa e sem spoiler.'
  },
  {
    icon: Users,
    title: 'Jogue em equipe',
    text: 'A rede de amigos, convites e salas ajuda a dividir descobertas, votar e fechar a teoria juntos.'
  },
  {
    icon: WandSparkles,
    title: 'Feche com teoria',
    text: 'Na hora de resolver, preencha os quatro campos e use a lógica do caso, não só palpites.'
  },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const returnUrl = useMemo(() => new URLSearchParams(location.search).get('return') || '/cases', [location.search]);

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || '';
      const response = await completeOnboarding(user.userId, token);
      if (response.success) {
        await refresh();
        navigate(returnUrl, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <section className="onboarding-hero">
        <span className="eyebrow">Primeiro acesso</span>
        <h1>Bem-vinda, investigadora.</h1>
        <p>Vamos mostrar o essencial para você entrar no jogo com segurança e sem manual técnico.</p>
        <div className="onboarding-cta-row">
          <button className="btn-primary" onClick={handleContinue} disabled={loading}>
            {loading ? 'Concluindo...' : 'Começar a investigar'}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/tutorial', { replace: true })}>
            Ver caso tutorial
          </button>
        </div>
      </section>

      <section className="onboarding-grid">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <article className="onboarding-card" key={step.title}>
              <Icon size={20} />
              <div>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="onboarding-example">
        <div>
          <span className="eyebrow">Exemplo rápido</span>
          <h2>Uma boa pergunta muda tudo</h2>
          <p>Em vez de perguntar algo amplo, mire numa pista concreta: objeto, pessoa, horário ou motivo.</p>
        </div>
        <div className="onboarding-example-box">
          <strong>“Havia trilhos sob o jardim?”</strong>
          <span><CheckCircle2 size={14} /> Sim. A resposta curta já aponta o caminho da investigação.</span>
        </div>
      </section>

      <div className="onboarding-footer">
        <button className="btn-secondary" onClick={() => navigate('/cases', { replace: true })}>
          Ir direto aos casos
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
