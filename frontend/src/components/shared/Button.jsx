export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const variants = {
    primary: 'bg-primary text-text hover:bg-primary/90',
    secondary: 'bg-secondary text-text hover:bg-secondary/90',
    soft: 'bg-surface-soft text-text hover:bg-primary/20',
    ghost: 'bg-transparent text-text border border-border hover:bg-surface-soft',
    success: 'bg-success text-white hover:bg-success/90',
    danger: 'bg-danger text-white hover:bg-danger/90'
  };

  return (
    <button
      type={type}
      className={`lift inline-flex items-center justify-center rounded-2xl border border-transparent px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
