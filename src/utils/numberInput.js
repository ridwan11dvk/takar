export function sanitizeDecimalInput(value, { allowNegative = false } = {}) {
  const normalized = String(value ?? '').replace(',', '.');
  let output = '';
  let hasDecimal = false;

  for (const char of normalized) {
    if (char >= '0' && char <= '9') {
      output += char;
      continue;
    }

    if (char === '.' && !hasDecimal) {
      output += char;
      hasDecimal = true;
      continue;
    }

    if (char === '-' && allowNegative && output.length === 0) {
      output += char;
    }
  }

  return output;
}

export function sanitizeIntegerInput(value, { allowNegative = false } = {}) {
  const raw = String(value ?? '');
  let output = '';

  for (const char of raw) {
    if (char >= '0' && char <= '9') {
      output += char;
      continue;
    }

    if (char === '-' && allowNegative && output.length === 0) {
      output += char;
    }
  }

  return output;
}
