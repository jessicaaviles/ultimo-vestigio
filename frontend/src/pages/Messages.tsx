import React, { useState } from 'react';

interface Chat {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: { sender: 'them' | 'me'; text: string; time: string }[];
}

const INITIAL_CHATS: Chat[] = [
  {
    id: 'system-ia',
    name: 'Mestre IA',
    role: 'Motor Forense',
    avatar: 'IA',
    lastMessage: 'Sistema de IA ativo. Pronto para receber e avaliar as teorias da sua equipe.',
    time: 'Agora',
    unread: false,
    messages: [
      { sender: 'them', text: 'Bem-vindo ao canal seguro do Último Vestígio. O motor forense está pronto para avaliar as teorias enviadas durante as investigações. Crie ou entre em uma sala para iniciar um caso.', time: 'Agora' }
    ]
  }
];

const Messages: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat) return;

    const newMessage = {
      sender: 'me' as const,
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChats = chats.map(chat => {
      if (chat.id === activeChat.id) {
        const nextMsgs = [...chat.messages, newMessage];
        return {
          ...chat,
          messages: nextMsgs,
          lastMessage: inputMessage,
          time: newMessage.time,
          unread: false
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setActiveChat({
      ...activeChat,
      messages: [...activeChat.messages, newMessage],
      lastMessage: inputMessage,
      time: newMessage.time
    });
    setInputMessage('');
  };

  return (
    <div className="messages-page" style={{
      minHeight: '100vh',
      backgroundColor: '#0F1417',
      color: '#F8F9FA',
      paddingBottom: '80px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Se não houver chat ativo, mostra a lista */}
      {!activeChat ? (
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '64px' }}>
          <div>
            <span style={{ color: '#C5A880', fontSize: '10px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>
              CANAL SEGURO
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, margin: '4px 0' }}>
              Comunicações
            </h1>
            <p style={{ color: '#8E989F', fontSize: '14px', margin: 0, fontWeight: 300 }}>
              Fale com outros membros da equipe ou com a IA do Mestre.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat);
                  // Marcar como lida
                  setChats(chats.map(c => c.id === chat.id ? { ...c, unread: false } : c));
                }}
                style={{
                  backgroundColor: '#13191C',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {chat.unread && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#C5A880'
                  }}></div>
                )}
                
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#C5A880'
                }}>
                  {chat.avatar}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>{chat.name}</h3>
                    <span style={{ fontSize: '10px', color: '#8E989F' }}>{chat.time}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    {chat.role}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#8E989F',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: chat.unread ? 500 : 300
                  }}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Chat Ativo */
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', position: 'relative' }}>
          {/* Header do Chat */}
          <div style={{
            padding: '48px 24px 16px 24px',
            backgroundColor: '#13191C',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button className="btn-primary"
              onClick={() => setActiveChat(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8E989F',
                cursor: 'pointer',
                fontSize: '18px',
                padding: 0
              }}
            >
              ←
            </button>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>{activeChat.name}</h3>
              <span style={{ fontSize: '11px', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeChat.role}
              </span>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {activeChat.messages.map((msg, index) => {
              const isMe = msg.sender === 'me';
              return (
                <div 
                  key={index}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    backgroundColor: isMe ? 'rgba(197, 168, 128, 0.15)' : '#13191C',
                    color: '#F8F9FA',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isMe ? '1px solid rgba(197, 168, 128, 0.25)' : '1px solid rgba(255,255,255,0.02)',
                    fontSize: '14px',
                    lineHeight: 1.45,
                    fontWeight: 300
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '9px', color: '#8E989F', marginTop: '4px', padding: '0 4px' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Campo de Envio */}
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#13191C',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua mensagem de rádio..."
              style={{
                flex: 1,
                backgroundColor: '#0F1417',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#F8F9FA',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleSendMessage}
              style={{
                backgroundColor: '#C5A880',
                color: '#0F1417',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
