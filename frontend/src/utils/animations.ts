/**
 * animations.ts — Shared Framer Motion constants for Tarazu
 *
 * Centralises all timing, easing, and variant definitions so every view and
 * modal uses the same motion language. Import what you need; don't invent
 * per-component timing.
 *
 * Respects `prefers-reduced-motion` — call `useMotionConfig()` to get
 * reduced-safe variants automatically.
 */

import { Variants, Transition } from 'framer-motion';

// ── Timing constants ─────────────────────────────────────────
export const DURATION = {
  instant:  0.08,
  fast:     0.15,
  normal:   0.25,
  slow:     0.40,
  verySlow: 0.60,
} as const;

// ── Easing presets ───────────────────────────────────────────
export const EASE = {
  out:     [0.16, 1, 0.3, 1] as [number, number, number, number],
  in:      [0.4, 0, 1, 1]   as [number, number, number, number],
  inOut:   [0.4, 0, 0.2, 1] as [number, number, number, number],
  snappy:  [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 0.8,
};

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.7,
};

// ── Page transition (used in App.tsx AnimatePresence) ────────
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.fast, ease: EASE.in },
  },
};

// Reduced-motion version — fade only
export const pageTransitionReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.normal } },
  exit:    { opacity: 0, transition: { duration: DURATION.fast } },
};

// ── Staggered container (parent) ─────────────────────────────
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const containerVariantsFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0,
    },
  },
};

// ── Item variants (children of staggered container) ──────────
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING_SOFT,
  },
};

export const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: DURATION.normal } },
};

// Horizontal item (for tab bars, nav items)
export const itemVariantsHorizontal: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: SPRING_SOFT,
  },
};

// ── Modal / dialog ────────────────────────────────────────────
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.fast, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE.in, delay: 0.05 },
  },
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_SNAPPY,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: DURATION.fast, ease: EASE.in },
  },
};

export const modalVariantsReduced: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal } },
  exit:    { opacity: 0, transition: { duration: DURATION.fast } },
};

// ── Dropdown / popover ────────────────────────────────────────
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: DURATION.instant, ease: EASE.in },
  },
};

// ── Slide-in from bottom (toast, demo guide) ─────────────────
export const slideUpVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_SOFT,
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: DURATION.fast, ease: EASE.in },
  },
};

// ── Number / metric reveal ────────────────────────────────────
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: SPRING_SNAPPY,
  },
};

/**
 * Returns the motion-safe or reduced variant set based on
 * `prefers-reduced-motion`. Use this in components so they
 * automatically degrade gracefully.
 */
export function getMotionVariants<T extends Record<string, Variants>>(
  variants: T,
  reducedVariants: T,
  prefersReduced: boolean,
): T {
  return prefersReduced ? reducedVariants : variants;
}
