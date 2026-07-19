import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const RecoveryCode: React.FC = () => {
  const { roomId } = useParams(); const navigate = useNavigate(); const query = new URLSearchParams(useLocation().search);
  const code = query.get('code') || 'indisponível'; const publicCode = query.get('publicCode') || ''; const invite = query.get('invite') || `${window.location.origin}/join?room=${publicCode}`;
  const copy = () => navigator.clipboard?.writeText(code);
  return <div className="recovery-page"><span className="eyebrow">Apenas para o anfitrião</span><h1>Código de recuperação</h1><p>Guarde este código. Ele permite recuperar o controle da sala em outro dispositivo. Não compartilhe com os demais jogadores.</p><div className="recovery-code">{code}</div><div className="invite-panel"><div><span className="eyebrow">Convite da equipe</span><strong>{publicCode || 'Código da sala indisponível'}</strong><button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(invite)}>Copiar link</button></div><div className="qr-wrapper"><QRCodeCanvas value={invite} size={112} bgColor="#ffffff" fgColor="#182126" /></div></div><div className="recovery-actions"><button className="btn-secondary" onClick={copy}>Copiar código</button><button className="btn-primary" onClick={() => navigate(`/room/${roomId}/lobby`)}>Continuar para o lobby</button></div></div>;
};
export default RecoveryCode;
