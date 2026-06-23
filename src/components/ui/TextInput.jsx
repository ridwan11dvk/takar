import { sanitizeDecimalInput, sanitizeIntegerInput } from '../../utils/numberInput.js';

export default function TextInput({
  label,
  className = '',
  type = 'text',
  integer = false,
  allowNegative = false,
  onChange,
  ...props
}) {
  const isNumber = type === 'number';

  function handleChange(event) {
    if (!isNumber) {
      onChange?.(event);
      return;
    }

    const sanitizer = integer ? sanitizeIntegerInput : sanitizeDecimalInput;
    const value = sanitizer(event.target.value, { allowNegative });
    onChange?.({
      ...event,
      target: {
        ...event.target,
        value,
      },
    });
  }

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-sm font-bold text-text-secondary">{label}</span>}
      <input
        type={isNumber ? 'text' : type}
        inputMode={isNumber ? (integer ? 'numeric' : 'decimal') : undefined}
        className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-semibold outline-none focus:border-primary"
        onChange={handleChange}
        {...props}
      />
    </label>
  );
}
