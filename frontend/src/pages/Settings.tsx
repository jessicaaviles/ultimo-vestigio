import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accessibility,
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  Globe2,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  Megaphone,
  Mic2,
  Moon,
  Music2,
  ShieldCheck,
  Type,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const cycle = <T,>(values: T[], current: T) => values[(values.indexOf(current) + 1) % values.length];

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { settings, updateSetting, resetSettings } = useSettings();

  const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
  };

  const updateNotification = async (key: 'push' | 'invites' | 'updates' | 'weekly', checked: boolean) => {
    if (key === 'push' && checked && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      update('push', permission === 'granted');
      return;
    }
    update(key, checked);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const preferenceRows = [
    {
      icon: Globe2,
      label: 'Idioma',
      value: settings.language,
      onClick: () => update('language', cycle(['Português (Brasil)', 'English'], settings.language)),
    },
    {
      icon: Moon,
      label: 'Tema',
      value: settings.theme,
      onClick: () => update('theme', cycle(['Escuro', 'Alto contraste'], settings.theme)),
    },
    {
      icon: Type,
      label: 'Tamanho do texto',
      value: settings.textSize,
      onClick: () => update('textSize', cycle(['Pequeno', 'Médio', 'Grande'], settings.textSize)),
    },
    {
      icon: Accessibility,
      label: 'Acessibilidade',
      value: settings.accessibility,
      helper: 'Contraste, movimento e legibilidade.',
      onClick: () => update('accessibility', cycle(['Padrão', 'Contraste alto', 'Reduzir movimento'], settings.accessibility)),
    },
  ];

  const audioRows = [
    { icon: Music2, label: 'Música', key: 'music' as const },
    { icon: Volume2, label: 'Efeitos sonoros', key: 'effects' as const },
    { icon: Mic2, label: 'Voz dos personagens', key: 'voices' as const },
  ];

  const notificationRows = [
    { icon: Bell, label: 'Notificações push', key: 'push' as const },
    { icon: Mail, label: 'Convites de amigos', key: 'invites' as const },
    { icon: Megaphone, label: 'Novidades e atualizações', key: 'updates' as const },
    { icon: CalendarDays, label: 'Resumo semanal', key: 'weekly' as const },
  ];

  const aboutRows = [
    { icon: HelpCircle, label: 'Ajuda e suporte', value: '', onClick: () => navigate('/tutorial') },
    { icon: ShieldCheck, label: 'Política de privacidade', value: '', onClick: () => navigate('/privacy') },
    { icon: FileText, label: 'Termos de uso', value: '', onClick: () => navigate('/terms') },
    { icon: Info, label: 'Versão do jogo', value: '1.0.2' },
  ];

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div className="settings-hero-copy">
          <span className="eyebrow">Configurações</span>
          <h1>Personalize sua experiência</h1>
          <p>Ajuste o jogo do seu jeito.</p>
        </div>
      </section>

      <section className="settings-section">
        <span className="eyebrow">Preferências</span>
        <div className="settings-list">
          {preferenceRows.map(({ icon: Icon, label, value, helper, onClick }) => (
            <button className="settings-row" key={label} onClick={onClick}>
              <Icon size={20} strokeWidth={1.5} />
              <span className="settings-row-copy">
                <strong>{label}</strong>
                {helper && <small>{helper}</small>}
              </span>
              <span className="settings-row-value">{value}</span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <span className="eyebrow">Áudio</span>
        <div className="settings-list">
          {audioRows.map(({ icon: Icon, label, key }) => (
            <label className="settings-row settings-row--slider" key={key}>
              <Icon size={20} strokeWidth={1.5} />
              <span className="settings-row-copy">
                <strong>{label}</strong>
              </span>
              <input
                aria-label={label}
                type="range"
                min={0}
                max={100}
                value={settings[key]}
                onChange={(event) => update(key, Number(event.target.value))}
              />
              <span className="settings-row-percent">{settings[key]}%</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <span className="eyebrow">Notificações</span>
        <div className="settings-list">
          {notificationRows.map(({ icon: Icon, label, key }) => (
            <label className="settings-row settings-row--toggle" key={key}>
              <Icon size={20} strokeWidth={1.5} />
              <span className="settings-row-copy">
                <strong>{label}</strong>
              </span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) => updateNotification(key, event.target.checked)}
              />
              <span className="settings-switch" aria-hidden="true" />
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <span className="eyebrow">Sobre</span>
        <div className="settings-list">
          {aboutRows.map(({ icon: Icon, label, value, onClick }) => (
            <button className="settings-row" key={label} onClick={onClick} disabled={!onClick}>
              <Icon size={20} strokeWidth={1.5} />
              <span className="settings-row-copy">
                <strong>{label}</strong>
              </span>
              {value ? <span className="settings-row-value">{value}</span> : <ChevronRight size={17} />}
            </button>
          ))}
        </div>
      </section>

      <button className="settings-reset" onClick={resetSettings}>
        Restaurar configurações padrão
      </button>

      <button className="settings-logout" onClick={handleLogout}>
        <LogOut size={17} /> Sair da conta
      </button>
    </div>
  );
};

export default Settings;
