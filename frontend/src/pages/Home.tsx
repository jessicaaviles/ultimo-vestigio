import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { registerAnonymousUser } from '../services/api';

const featuredCases = [
  { title: 'O Quarto 7', subtitle: 'Hotel Vesper · Mistério clássico', level: 'Fácil', image: '/capa_quarto_7.png', description: 'Uma chave, uma câmera e a última noite de Helena Duarte.' },
  { title: 'O Presente Desaparecido', subtitle: 'Arquivo · Linha do tempo', level: 'Fácil', image: '/backgrounds/cena-do-crime.png', description: 'Durante uma comemoração em família, um presente desaparece de uma mesa diante de todos.' }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [, setUserData] = useState<{ userId: string; deviceToken: string } | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('deviceToken'); const userId = localStorage.getItem('userId');
    if (!token || !userId) registerAnonymousUser().then((res) => { if (res.success) { localStorage.setItem('deviceToken', res.data.deviceToken); localStorage.setItem('userId', res.data.userId); setUserData({ userId: res.data.userId, deviceToken: res.data.deviceToken }); } }).catch(() => undefined);
    else setUserData({ userId, deviceToken: token });
  }, []);

  return <div className="home route-page">
    <section className="home-hero">
      <div className="home-hero-image" />
      <div className="home-hero-copy">
        <img className="home-hero-logo" src="/logo-sem-fundo.png" alt="Último Vestígio" />
        <span className="eyebrow">Dossiê aberto · Temporada 01</span>
        <h1>A verdade está nos detalhes.</h1>
        <p>Investigue em equipe. Conecte os fatos. Encontre o último vestígio.</p>
        <div className="home-actions"><button className="btn-primary" onClick={() => navigate('/cases')}>Explorar casos <ArrowUpRight size={17} /></button><button className="btn-secondary" onClick={() => navigate('/join')}>Entrar com código</button></div>
        <button className="home-tutorial" onClick={() => navigate('/tutorial')}>Como funciona?</button>
      </div>
      <div className="home-hero-caption"><span>HOTEL VESPER</span><span>LAT. 41°23'N · 2026</span></div>
    </section>
    <section className="home-featured">
      <div className="section-heading"><div><span className="eyebrow">Arquivo municipal</span><h2>Investigações em destaque</h2></div><button className="text-link" onClick={() => navigate('/cases')}>Ver arquivo <ArrowUpRight size={15} /></button></div>
      <div className="case-rail">{featuredCases.map((item, index) => <article className={`featured-card ${index === 0 ? 'featured-card-primary' : ''}`} key={item.title} onClick={() => navigate('/cases')}>
        <div className="featured-image" style={{ backgroundImage: `url(${item.image})` }}><span className="case-index">0{index + 1}</span><span className="case-level">{item.level}</span></div>
        <div className="featured-info"><h3>{item.title}</h3><p>{item.subtitle}</p><span>{item.description}</span></div>
      </article>)}</div>
    </section>
    <section className="home-note"><div className="note-rule" /><div><span className="eyebrow">Método de investigação</span><p>“A IA aponta conexões. A decisão continua sendo sua.”</p></div></section>
  </div>;
};

export default Home;
