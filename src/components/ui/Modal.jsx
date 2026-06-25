export default function Modal({ title, children, onClose, footer }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-3 sm:place-items-center">
      <section aria-label={title} aria-modal="true" role="dialog" className="w-full max-w-lg rounded-[22px] bg-white p-4 shadow-raised">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" className="rounded-full px-3 py-1 text-xl font-bold text-text-secondary" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        {footer}
      </section>
    </div>
  );
}
