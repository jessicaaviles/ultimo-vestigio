import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface InvestigationContextData {
  activeCaseId: string | null;
  discoveredClues: string[]; // array of Evidence IDs
  addClue: (clueId: string) => void;
  hasClue: (clueId: string) => boolean;
}

const InvestigationContext = createContext<InvestigationContextData | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCaseId] = useState<string | null>('blackwell');
  
  const [discoveredClues, setDiscoveredClues] = useState<string[]>(() => {
    const saved = localStorage.getItem('jogo_investigacao_clues');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('jogo_investigacao_clues', JSON.stringify(discoveredClues));
  }, [discoveredClues]);

  const addClue = (clueId: string) => {
    if (!discoveredClues.includes(clueId)) {
      setDiscoveredClues((prev) => [...prev, clueId]);
    }
  };

  const hasClue = (clueId: string) => {
    return discoveredClues.includes(clueId);
  };

  return (
    <InvestigationContext.Provider value={{ activeCaseId, discoveredClues, addClue, hasClue }}>
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
