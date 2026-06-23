import { ChevronDown } from 'lucide-react';

export default function SelectInput({ label, children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-sm font-bold text-text-secondary">{label}</span>}
      <div className="relative">
        <select
          className="h-12 w-full appearance-none rounded-2xl border border-border bg-white pl-4 pr-10 font-semibold outline-none focus:border-primary"
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
      </div>
    </label>
  );
}
