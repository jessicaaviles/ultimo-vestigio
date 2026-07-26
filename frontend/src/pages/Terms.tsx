import React from 'react';

const Terms: React.FC = () => (
  <div className="legal-page">
    <span className="eyebrow">Termos de uso</span>
    <h1>Regras da investigação</h1>
    <p>
      Estes termos resumem as condições básicas de uso do jogo enquanto a versão jurídica
      completa é definida.
    </p>

    <section className="legal-panel">
      <h2>Uso do jogo</h2>
      <ul>
        <li>O Último Vestígio é uma experiência narrativa de investigação e dedução.</li>
        <li>O jogador é responsável pelas informações que adiciona ao perfil, salas e mensagens.</li>
        <li>Recursos online podem depender de conexão, autenticação e disponibilidade do servidor.</li>
      </ul>
    </section>

    <section className="legal-panel">
      <h2>Progresso e conteúdo</h2>
      <ul>
        <li>Casos, pistas, respostas e resoluções podem ser ajustados para melhorar a experiência.</li>
        <li>Ao resetar um caso, o progresso daquela investigação pode ser removido.</li>
        <li>Ao excluir a conta, os dados do jogador devem ser removidos do banco de dados.</li>
      </ul>
    </section>
  </div>
);

export default Terms;
