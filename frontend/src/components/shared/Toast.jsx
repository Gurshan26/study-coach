import { useStore } from '../../store/useStore.js';
import Button from './Button.jsx';

const toneStyles = {
  error: 'border-danger/55 bg-danger/12 text-danger',
  warning: 'border-accent/55 bg-accent/18 text-text',
  success: 'border-success/55 bg-success/18 text-text',
  info: 'border-secondary/55 bg-secondary/18 text-text'
};

export default function Toasts() {
  const { ui, removeToast } = useStore();

  return (
    <div className="fixed right-3 top-3 z-[70] space-y-3 md:right-4 md:top-4">
      {ui.toasts.map((toast) => (
        <div key={toast.id} className="card-shell w-[min(22rem,90vw)] p-3">
          <div className={`mb-2 rounded-xl border px-3 py-2 text-sm font-semibold ${toneStyles[toast.type] || toneStyles.info}`}>
            {toast.message}
          </div>
          <div className="flex justify-end">
            <Button variant="soft" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
              {toast.action || 'Dismiss'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
