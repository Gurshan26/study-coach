export default function ProgressBar({ current, total }) {
  const ratio = total ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div aria-label="quiz progress" className="h-2.5 w-full rounded-full bg-surface-soft">
      <div className="h-2.5 rounded-full bg-secondary transition-all" style={{ width: `${ratio}%` }} aria-hidden="true" />
    </div>
  );
}
