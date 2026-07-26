import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationsContext';

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

const Messages: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const { setUnreadMessages, clearMessages } = useNotifications();

  // Ao entrar na tela, zera o badge global de mensagens
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  // Mantém o contexto global sincronizado com a contagem local de não lidas
  useEffect(() => {
    const unreadCount = chats.filter(c => c.unread).length;
    setUnreadMessages(unreadCount);
  }, [chats, setUnreadMessages]);

  // Fallback se não usar o hook diretamente, ou idealmente import useSocket
  useEffect(() => {
    const handleClueUnlocked = (data: any) => {
      setChats(prev => prev.map(chat => {
        if (chat.id === 'system-ia') {
          const newMsg = {
            sender: 'them' as const,
            text: `Nova pista desbloqueada: ${data.clueId}. Investigador responsável: ${data.discoveredBy}. Verifique seu mapa ou painel de investigação para acessá-la.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg.text,
            time: newMsg.time,
            unread: true
          };
        }
        return chat;
      }));
    };

    const globalSocket = (window as any).globalSocketInstance;
    if (globalSocket) {
      globalSocket.on('clue_unlocked', handleClueUnlocked);
      return () => globalSocket.off('clue_unlocked', handleClueUnlocked);
    }
    
    const handleCustomEvent = (e: any) => handleClueUnlocked(e.detail);
    window.addEventListener('clue_discovered_notification', handleCustomEvent);
    return () => window.removeEventListener('clue_discovered_notification', handleCustomEvent);
  }, []);

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

    // Resposta automática se a mensagem for enviada para o Mestre Investigador fora de uma sala
    if (activeChat.id === 'system-ia') {
      setTimeout(() => {
        const reply = {
          sender: 'them' as const,
          text: 'Olá, investigador. O Motor Forense do Mestre Investigador opera exclusivamente dentro de salas de investigação ativas, pois necessito do contexto específico e das pistas de um caso para analisar e responder. Por favor, crie ou entre em uma sala na aba "Investigação" para iniciarmos a perícia.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChats(prevChats => prevChats.map(c => {
          if (c.id === 'system-ia') {
            return {
              ...c,
              messages: [...c.messages, reply],
              lastMessage: reply.text,
              time: reply.time
            };
          }
          return c;
        }));
        setActiveChat(prevActive => {
          if (prevActive && prevActive.id === 'system-ia') {
            return {
              ...prevActive,
              messages: [...prevActive.messages, reply],
              lastMessage: reply.text,
              time: reply.time
            };
          }
          return prevActive;
        });
      }, 1000);
    }
  };

  return (
    <div className="messages-page">
      {/* Se não houver chat ativo, mostra a lista */}
      {!activeChat ? (
        <div className="messages-shell">
          <header className="messages-header">
            <span className="messages-eyebrow">
              CANAL SEGURO
            </span>
            <h1>
              Comunicações
            </h1>
            <p>
              Fale com outros membros da equipe ou com o Mestre Investigador.
            </p>
          </header>

          <div className="messages-list" aria-label="Conversas disponiveis">
            {chats.length === 0 && (
              <div className="messages-empty-state">
                <h2>Nenhuma conversa disponível</h2>
                <p>As conversas aparecerão aqui quando uma sala ou investigação criar um canal de comunicação.</p>
              </div>
            )}
            {chats.map(chat => (
              <div
                key={chat.id}
                className="messages-chat-card"
                onClick={() => {
                  setActiveChat(chat);
                  // Marcar como lida
                  setChats(chats.map(c => c.id === chat.id ? { ...c, unread: false } : c));
                }}
              >
                {chat.unread && (
                  <div className="messages-unread-dot"></div>
                )}
                
                <div className="messages-avatar">
                  {chat.avatar}
                </div>

                <div className="messages-chat-content">
                  <div className="messages-chat-topline">
                    <h3>{chat.name}</h3>
                    <span>{chat.time}</span>
                  </div>
                  <div className="messages-chat-role">
                    {chat.role}
                  </div>
                  <p className={chat.unread ? 'is-unread' : undefined}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Chat Ativo */
        <div className="messages-thread">
          {/* Header do Chat */}
          <div style={{
            padding: '24px 24px 16px 24px',
            backgroundColor: '#13191C',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => setActiveChat(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8E989F',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
                lineHeight: 1
              }}
            >
              ←
            </button>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>{activeChat.name}</h3>
              <span style={{ fontSize: '11px', color: 'var(--eyebrow-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
