export default function QtyStepper({ value, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-surface-alt p-1">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-[10px] bg-white text-xl font-bold text-primary"
        onClick={onDecrease}
      >
        -
      </button>
      <span className="min-w-6 text-center text-base font-extrabold">{value}</span>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-[10px] bg-white text-xl font-bold text-primary"
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  );
}
