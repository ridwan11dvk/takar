export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const variantClass =
    variant === 'primary'
      ? 'bg-primary text-white shadow-primary disabled:bg-[#E7DFD4] disabled:text-[#B3A89B] disabled:shadow-none'
      : variant === 'warning'
        ? 'bg-warning text-white'
        : 'border border-border bg-white text-text';

  return (
    <button
      type={type}
      className={`min-h-12 rounded-2xl px-4 font-bold transition ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
