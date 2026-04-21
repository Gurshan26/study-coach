export default function TopicHeatmap({ weakTopics }) {
  const cells = new Array(28)
    .fill(0)
    .map((_, idx) => weakTopics[idx % Math.max(weakTopics.length, 1)]?.weakScore || 0);

  return (
    <div className="card-shell p-4">
      <h3 className="mb-3 font-display text-xl text-text">Study Activity Heatmap</h3>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((value, idx) => (
          <div
            key={idx}
            className="h-7 rounded-lg border border-border"
            style={{ backgroundColor: `rgba(var(--primary-rgb), ${Math.max(0.14, value * 0.95)})` }}
            aria-label={`heat-${idx}`}
          />
        ))}
      </div>
    </div>
  );
}
