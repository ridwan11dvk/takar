import { describe, expect, it } from 'vitest';
import { sanitizeDecimalInput, sanitizeIntegerInput } from './numberInput.js';

describe('number input sanitizers', () => {
  it('keeps only digits and one decimal separator for decimal values', () => {
    expect(sanitizeDecimalInput('12abc3')).toBe('123');
    expect(sanitizeDecimalInput('10e5')).toBe('105');
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
    expect(sanitizeDecimalInput('-40')).toBe('40');
    expect(sanitizeDecimalInput('1,5')).toBe('1.5');
  });

  it('allows a leading minus only when explicitly requested', () => {
    expect(sanitizeDecimalInput('-40', { allowNegative: true })).toBe('-40');
    expect(sanitizeDecimalInput('12-3', { allowNegative: true })).toBe('123');
  });

  it('keeps only digits for integer values', () => {
    expect(sanitizeIntegerInput('Rp 18.000')).toBe('18000');
    expect(sanitizeIntegerInput('10e5')).toBe('105');
    expect(sanitizeIntegerInput('-500')).toBe('500');
  });
});
