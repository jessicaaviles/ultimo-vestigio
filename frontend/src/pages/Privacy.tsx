import React from 'react';

const Privacy: React.FC = () => (
  <div className="legal-page">
    <span className="eyebrow">Política de privacidade</span>
    <h1>Seus dados no Último Vestígio</h1>
    <p>
      Esta página resume como o jogo deve tratar as informações do investigador durante a experiência.
      Use-a como referência inicial enquanto a política jurídica definitiva é preparada.
    </p>

    <section className="legal-panel">
      <h2>O que pode ser salvo</h2>
      <ul>
        <li>Dados de conta, como nome, e-mail e retrato de perfil.</li>
        <li>Progresso de casos, salas, pistas encontradas e teorias enviadas.</li>
        <li>Preferências locais, como tema, tamanho do texto, áudio e notificações.</li>
      </ul>
    </section>

    <section className="legal-panel">
      <h2>Controle do jogador</h2>
      <ul>
        <li>Você pode sair da conta pela página de perfil ou configurações.</li>
        <li>Você pode excluir a conta pela página de perfil.</li>
        <li>Preferências de interface ficam salvas no dispositivo e podem ser restauradas nas configurações.</li>
      </ul>
    </section>
  </div>
);

export default Privacy;
