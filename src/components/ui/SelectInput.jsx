export default function SelectInput({ label, children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-bold text-text-secondary">{label}</span>
      <select
        className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-semibold outline-none focus:border-primary"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
