export default function Card({ children, className = '' }) {
  return (
    <section className={`rounded-[20px] border border-border bg-surface p-4 shadow-soft ${className}`}>
      {children}
    </section>
  );
}
