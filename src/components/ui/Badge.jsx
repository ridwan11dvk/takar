const toneClass = {
  success: 'bg-[#E6F4EA] text-success',
  warning: 'bg-[#FCEFD6] text-warning',
  danger: 'bg-[#FBE6E6] text-danger',
};

const dotClass = {
  success: 'bg-success',
  warning: 'bg-[#D97706]',
  danger: 'bg-danger',
};

export default function Badge({ label, tone = 'success' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${toneClass[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} />
      {label}
    </span>
  );
}
