import Button from './Button.jsx';

export default function Modal({ open, title, children, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="card-shell paper-grain w-full max-w-2xl p-6">
        <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-text">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
