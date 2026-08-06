import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { resetCaseProgress } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { markAllProgressReset, readSolvedCases } from '../utils/progressReset';

const clearLocalCaseState = (caseSlug: string, userId: string) => {
  localStorage.removeItem('currentRoomId');
  localStorage.removeItem('currentRoomCode');

  if (caseSlug.toLowerCase() === 'all') {
    markAllProgressReset(userId);
  } else {
    const solvedCases = readSolvedCases();
    if (Array.isArray(solvedCases)) {
      localStorage.setItem('solvedCases', JSON.stringify(solvedCases.filter((slug) => slug !== caseSlug)));
    }
  }

  Object.keys(localStorage)
    .filter((key) => key.startsWith('analyzed_'))
    .forEach((key) => localStorage.removeItem(key));
};

const ResetCaseProgress: React.FC = () => {
  const { caseSlug = 'blackwell' } = useParams();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [message, setMessage] = useState('Resetando progresso do caso...');

  useEffect(() => {
    const runReset = async () => {
      const token = localStorage.getItem('authToken');
      const userId = user?.userId || localStorage.getItem('userId');
      const resetAllCases = caseSlug.toLowerCase() === 'all';

      if (resetAllCases && userId) {
        clearLocalCaseState(caseSlug, userId);
      }

      if (!userId || !token) {
        setMessage('Entre na sua conta para resetar este caso.');
        return;
      }

      const response = await resetCaseProgress(userId, caseSlug, token);
      if (!response.success && !resetAllCases) {
        setMessage(response.error || 'Não foi possível resetar este caso agora.');
        return;
      }

      if (!resetAllCases) {
        clearLocalCaseState(caseSlug, userId);
      }
      await refresh();
      setMessage(resetAllCases && !response.success
        ? 'Progresso local resetado. Voltando para o início...'
        : 'Progresso resetado. Voltando para o início...');
      window.setTimeout(() => navigate('/', { replace: true }), 900);
    };

    runReset().catch(() => setMessage('Não foi possível resetar este caso agora.'));
  }, [caseSlug, navigate, refresh, user?.userId]);

  return (
    <div className="reset-case-page">
      <div className="reset-case-card">
        <RotateCcw size={32} />
        <span className="eyebrow">Reset de progresso</span>
        <h1>{caseSlug.toLowerCase() === 'all' ? 'Todo o progresso' : caseSlug === 'blackwell' ? 'Mansão Blackwell' : 'Caso'}</h1>
        <p>{message}</p>
        <button className="btn-secondary" onClick={() => navigate('/', { replace: true })}>
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default ResetCaseProgress;
