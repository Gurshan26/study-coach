function tone(topic) {
  if (topic.tag === 'strong') {
    return 'border-success/60 bg-success/15';
  }
  if (topic.tag === 'improving') {
    return 'border-accent/60 bg-accent/17';
  }
  return 'border-danger/60 bg-danger/12';
}

export default function WeakTopicCard({ topic, onSelect }) {
  const trend = topic.trend === 'improving' ? '↑' : topic.trend === 'declining' ? '↓' : '→';
  const percent = Math.round(topic.weakScore * 100);

  return (
    <button className="card-shell lift p-4 text-left" onClick={() => onSelect(topic)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{topic.tag}</p>
          <h3 className="mt-1 font-display text-2xl text-text">{topic.topic}</h3>
        </div>

        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 font-mono text-xs font-bold text-text ${tone(topic)}`}
          style={{
            backgroundImage: `conic-gradient(rgb(var(--primary-rgb)) ${percent * 3.6}deg, rgb(var(--surface-soft-rgb)) 0deg)`
          }}
        >
          <span className="rounded-full bg-surface px-1.5 py-0.5">{percent}%</span>
        </div>
      </div>

      <p className="text-sm font-semibold text-text">Weakness: {percent}%</p>
      <p className="text-xs text-text-muted">Trend: {trend}</p>
    </button>
  );
}
