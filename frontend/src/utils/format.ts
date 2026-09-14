/**
 * utils/format.ts — Shared formatting utilities for Tarazu
 */

/**
 * Format Indian Rupee values in human-readable form.
 * Uses full words (Lakh, Crore, Thousand) — no unexplained abbreviations.
 */
const formatInrBase = (val: number): string => {
  if (val === 0) return '₹0';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (absVal >= 10000000) return `${sign}₹${(absVal / 10000000).toFixed(2)} Crore`;
  if (absVal >= 100000) return `${sign}₹${(absVal / 100000).toFixed(2)} Lakh`;
  return `${sign}₹${Math.round(absVal).toLocaleString('en-IN')}`;
};

/**
 * Compact format for display in tight spaces (navbar badge, etc.)
 */
const formatInrCompactBase = (val: number): string => {
  if (val === 0) return '₹0';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (absVal >= 10000000) return `${sign}₹${(absVal / 10000000).toFixed(1)} Cr`;
  if (absVal >= 100000) return `${sign}₹${(absVal / 100000).toFixed(1)} L`;
  return `${sign}₹${Math.round(absVal).toLocaleString('en-IN')}`;
};

/**
 * Format a percentage cleanly.
 */
export const formatPct = (val: number, decimals = 1): string =>
  `${val.toFixed(decimals)}%`;

/**
 * Format a multiplier ratio.
 */
export const formatRatio = (val: number): string => `${val.toFixed(1)}x`;

/**
 * Truncate text to a given length.
 */
export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? `${str.slice(0, maxLen - 1)}…` : str;

// ── Client-side FX rates (INR → target) — mirrors backend currency_service.py ─
const FX_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.01196,
  EUR: 0.01098,
  GBP: 0.00939,
  AED: 0.04391,
  SGD: 0.01604,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  SGD: 'S$',
};

/**
 * Format a value in the given currency.
 * When currency === 'INR' (default), delegates to formatInrBase.
 * Otherwise converts from INR and displays in the foreign currency.
 */
export const formatMoney = (valInr: number, currency = 'INR'): string => {
  const cur = (currency || 'INR').toUpperCase();
  if (cur === 'INR') return formatInrBase(valInr);
  const rate = FX_RATES[cur] ?? 1.0;
  const converted = valInr * rate;
  const sym = CURRENCY_SYMBOLS[cur] ?? `${cur} `;
  if (Math.abs(converted) >= 1_000_000) return `${sym}${(converted / 1_000_000).toFixed(2)}M`;
  if (Math.abs(converted) >= 1_000) return `${sym}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return `${sym}${converted.toFixed(2)}`;
};

export const formatMoneyCompact = (valInr: number, currency = 'INR'): string => {
  const cur = (currency || 'INR').toUpperCase();
  if (cur === 'INR') return formatInrCompactBase(valInr);
  const rate = FX_RATES[cur] ?? 1.0;
  const converted = valInr * rate;
  const sym = CURRENCY_SYMBOLS[cur] ?? `${cur} `;
  if (Math.abs(converted) >= 1_000_000) return `${sym}${(converted / 1_000_000).toFixed(1)}M`;
  if (Math.abs(converted) >= 1_000) return `${sym}${(converted / 1_000).toFixed(1)}K`;
  return `${sym}${converted.toFixed(0)}`;
};

/**
 * Reads the stored currency preference and formats accordingly.
 */
export const formatMoneySetting = (valInr: number): string => {
  try {
    const raw = localStorage.getItem('tarazu_settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (s.currency && s.currency !== 'INR') return formatMoney(valInr, s.currency);
    }
  } catch { /* ignore */ }
  return formatInrBase(valInr);
};

export const formatMoneyCompactSetting = (valInr: number): string => {
  try {
    const raw = localStorage.getItem('tarazu_settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (s.currency && s.currency !== 'INR') return formatMoneyCompact(valInr, s.currency);
    }
  } catch { /* ignore */ }
  return formatInrCompactBase(valInr);
};

// Re-export as formatInr and formatInrCompact so that legacy imports across the app 
// automatically get the global currency conversions without refactoring everywhere.
export const formatInr = formatMoneySetting;
export const formatInrCompact = formatMoneyCompactSetting;

