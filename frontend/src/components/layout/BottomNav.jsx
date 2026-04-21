import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/upload', label: 'Upload', icon: '📎' },
  { to: '/quiz', label: 'Quiz', icon: '🧠' },
  { to: '/flashcards', label: 'Cards', icon: '🃏' },
  { to: '/weak-topics', label: 'Topics', icon: '📈' }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.2rem)] max-w-md -translate-x-1/2 justify-between rounded-2xl border border-border/90 bg-surface/95 p-2 shadow-card backdrop-blur md:hidden">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex min-w-[3.9rem] flex-col items-center rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
              isActive ? 'bg-primary/25 text-text' : 'text-text-muted hover:bg-surface-soft'
            }`
          }
        >
          <span aria-hidden="true" className="text-base leading-none">
            {link.icon}
          </span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
