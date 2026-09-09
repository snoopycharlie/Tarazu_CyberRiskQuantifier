/**
 * utils/format.ts — Shared formatting utilities for Tarazu
 */

/**
 * Format Indian Rupee values in human-readable form.
 * Uses full words (Lakh, Crore, Thousand) — no unexplained abbreviations.
 */
export const formatInr = (val: number): string => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Crore`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)} Thousand`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

/**
 * Compact format for display in tight spaces (navbar badge, etc.)
 */
export const formatInrCompact = (val: number): string => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
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
