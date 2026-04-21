export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-soft ${className}`} aria-hidden="true" />;
}
