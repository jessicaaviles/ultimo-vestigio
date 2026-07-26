import React from 'react';
import { useNavigate } from 'react-router-dom';

const Tutorial: React.FC = () => {
  const navigate = useNavigate();
  const steps = [
    'Observe a situação inicial',
    'Pergunte apenas quando for sua vez',
    'Conecte respostas no histórico',
    'Vote e revele a verdade',
  ];

  return (
    <div className="tutorial-page">
      <span className="eyebrow">Primeiro dossiê</span>
      <h1>Como investigar</h1>
      <p>Faça perguntas objetivas, acompanhe o histórico, use pistas com cuidado e construa sua teoria em equipe.</p>
      <div className="tutorial-steps">
        {steps.map((step, index) => (
          <div key={step}>
            <span>0{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => navigate('/cases')}>Abrir casos</button>
    </div>
  );
};

export default Tutorial;
