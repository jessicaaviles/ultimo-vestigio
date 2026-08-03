export interface UnlockedClue {
  clueId: string;
  discoveredAt: string;
  discoveredBy: string;
}

export interface InvestigationContextData {
  activeCaseId: string | null;
  unlockedLocations: string[];
  unlockedClues: UnlockedClue[];
  hasClue: (clueId: string) => boolean;
  hasLocation: (locId: string) => boolean;
}
