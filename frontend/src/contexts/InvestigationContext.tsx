import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSocket } from './useSocket';

export interface UnlockedClue {
  clueId: string;
  discoveredAt: string;
  discoveredBy: string;
}

interface InvestigationContextData {
  activeCaseId: string | null;
  unlockedLocations: string[];
  unlockedClues: UnlockedClue[];
  hasClue: (clueId: string) => boolean;
  hasLocation: (locId: string) => boolean;
}

const InvestigationContext = createContext<InvestigationContextData | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCaseId] = useState<string | null>('blackwell');
  const [unlockedLocations, setUnlockedLocations] = useState<string[]>(['living_room']);
  const [unlockedClues, setUnlockedClues] = useState<UnlockedClue[]>([]);
  
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleRoomState = (state: any) => {
      try {
        if (state.settings) {
          const settingsObj = typeof state.settings === 'string' ? JSON.parse(state.settings) : state.settings;
          if (settingsObj.unlockedLocations) setUnlockedLocations(settingsObj.unlockedLocations);
          if (settingsObj.unlockedClues) setUnlockedClues(settingsObj.unlockedClues);
        }
      } catch (err) {
        console.error("Failed to parse room settings", err);
      }
    };

    const handleClueUnlocked = (data: UnlockedClue) => {
      setUnlockedClues(prev => {
        if (prev.some(c => c.clueId === data.clueId)) return prev;
        return [...prev, data];
      });
      const event = new CustomEvent('clue_discovered_notification', { detail: { clueId: data.clueId, finderName: data.discoveredBy } });
      window.dispatchEvent(event);
    };

    const handleLocationUnlocked = (data: { locationId: string }) => {
      setUnlockedLocations(prev => {
        if (prev.includes(data.locationId)) return prev;
        return [...prev, data.locationId];
      });
    };
    const clearRoomState = () => {
      localStorage.removeItem('currentRoomId');
      localStorage.removeItem('currentRoomCode');
      setUnlockedLocations(['living_room']);
      setUnlockedClues([]);
    };
    const handleRoomError = (err: string) => {
      if (String(err).includes('Você não está nesta sala')) clearRoomState();
    };

    socket.on('room_state_updated', handleRoomState);
    socket.on('clue_unlocked', handleClueUnlocked);
    socket.on('location_unlocked', handleLocationUnlocked);
    socket.on('room_error', handleRoomError);
    socket.on('left_room', clearRoomState);

    // Initial load request
    const roomId = localStorage.getItem('currentRoomId');
    if (roomId) socket.emit('join_room', { roomId, userId: localStorage.getItem('userId') });

    return () => {
      socket.off('room_state_updated', handleRoomState);
      socket.off('clue_unlocked', handleClueUnlocked);
      socket.off('location_unlocked', handleLocationUnlocked);
      socket.off('room_error', handleRoomError);
      socket.off('left_room', clearRoomState);
    };
  }, [socket]);

  const hasClue = (clueId: string) => unlockedClues.some(c => c.clueId === clueId);
  const hasLocation = (locId: string) => unlockedLocations.includes(locId);

  return (
    <InvestigationContext.Provider value={{ activeCaseId, unlockedLocations, unlockedClues, hasClue, hasLocation }}>
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = () => {
  const context = useContext(InvestigationContext);
  if (context === undefined) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
