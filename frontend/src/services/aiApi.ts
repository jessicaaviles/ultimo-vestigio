const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';

export interface EvidenceAnalysisRequest {
  evidenceId: string;
  title: string;
  desc: string;
  type: string;
}

export const analyzeEvidenceApi = async (data: EvidenceAnalysisRequest): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/ai/evidence-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const result = await response.json();
    return result.analysis;
  } catch (error) {
    console.error('Error analyzing evidence:', error);
    throw new Error('Falha ao analisar evidência');
  }
};
