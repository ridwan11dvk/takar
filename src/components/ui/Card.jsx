export default function Card({ children, className = '', ...props }) {
  return (
    <section className={`rounded-[20px] border border-border bg-surface p-4 shadow-soft ${className}`} {...props}>
      {children}
    </section>
  );
}
