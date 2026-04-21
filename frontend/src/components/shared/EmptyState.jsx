export default function EmptyState({ title, description }) {
  return (
    <div className="card-shell paper-grain p-8 text-center">
      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-soft text-xl">
          ✨
        </div>
        <h3 className="font-display text-3xl text-text">{title}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}
