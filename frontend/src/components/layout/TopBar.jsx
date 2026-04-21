import { useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore.js';
import Button from '../shared/Button.jsx';

const titleMap = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload Notes',
  '/quiz': 'Quiz Session',
  '/flashcards': 'Flashcards',
  '/weak-topics': 'Weak Topics'
};

export default function TopBar() {
  const location = useLocation();
  const { ui, toggleTheme } = useStore();

  return (
    <header className="card-shell paper-grain flex items-center justify-between gap-3 p-4">
      <div className="relative z-10">
        <p className="font-display text-2xl text-text">{titleMap[location.pathname] || 'StudyCoach'}</p>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
            ui.offline
              ? 'border-danger/60 bg-danger/15 text-danger'
              : 'border-success/50 bg-success/15 text-success'
          }`}
        >
          {ui.offline ? 'Offline queue' : 'Connected'}
        </span>
        <Button variant="soft" onClick={toggleTheme} aria-label="Toggle theme">
          {ui.theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </Button>
      </div>
    </header>
  );
}
