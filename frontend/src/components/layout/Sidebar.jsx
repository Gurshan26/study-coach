import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/upload', label: 'Upload Notes', icon: '📎' },
  { to: '/quiz', label: 'Quiz', icon: '🧠' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { to: '/weak-topics', label: 'Weak Topics', icon: '📈' }
];

export default function Sidebar() {
  return (
    <aside className="card-shell paper-grain hidden w-72 shrink-0 p-5 md:block">
      <div className="relative z-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">StudyCoach</p>
        <h1 className="mt-2 font-display text-3xl text-text">StudyCoach</h1>
        <p className="mt-2 text-sm text-text-muted">Upload notes, practice smart, and track what needs attention.</p>
      </div>

      <nav className="relative z-10 mt-7 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `lift flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-primary/70 bg-primary/28 text-text'
                  : 'border-transparent bg-surface-soft text-text-muted hover:border-border hover:text-text'
              }`
            }
          >
            <span aria-hidden="true" className="text-base leading-none">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
