/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Semantic aliases → CSS variables ─────────────── */
        /* Text */
        ink:       "var(--text-primary)",
        slate:     "var(--text-secondary)",
        smoke:     "var(--text-muted)",
        ash:       "var(--text-muted)",

        /* Surfaces */
        paper:     "var(--bg-surface)",
        fog:       "var(--bg-page)",
        mist:      "var(--border-subtle)",

        /* Brand */
        sienna:    "var(--accent-primary)",     // legacy → teal now
        peach:     "var(--accent-subtle)",      // legacy → teal-subtle

        /* Risk */
        crimson:   "var(--risk-critical)",
        amber:     "var(--risk-high)",
        emerald:   "var(--risk-low)",

        /* Explicit semantic names */
        'cyber-blue':   "var(--accent-primary)",
        'cyber-cyan':   "var(--accent-primary)",
        'cyber-purple': "var(--accent-primary)",
        'cyber-teal':   "var(--accent-primary)",

        'surface-1':    "var(--bg-surface)",
        'surface-2':    "var(--bg-surface-hover)",
        'surface-3':    "var(--bg-elevated)",

        'border-dim':   "var(--border-subtle)",
        'border-soft':  "var(--border-strong)",

        'text-primary':   "var(--text-primary)",
        'text-secondary': "var(--text-secondary)",
        'text-muted':     "var(--text-muted)",

        /* Risk level colors */
        'risk-critical': "var(--risk-critical)",
        'risk-high':     "var(--risk-high)",
        'risk-medium':   "var(--risk-medium)",
        'risk-low':      "var(--risk-low)",

        /* BG aliases for risk */
        'risk-critical-bg':     "var(--risk-critical-bg)",
        'risk-critical-border': "var(--risk-critical-border)",
        'risk-high-bg':         "var(--risk-high-bg)",
        'risk-high-border':     "var(--risk-high-border)",
        'risk-medium-bg':       "var(--risk-medium-bg)",
        'risk-medium-border':   "var(--risk-medium-border)",
        'risk-low-bg':          "var(--risk-low-bg)",
        'risk-low-border':      "var(--risk-low-border)",

        /* Nav */
        'nav-bg':     "var(--nav-bg)",
        'nav-border': "var(--nav-border)",

        /* Accent */
        'accent':         "var(--accent-primary)",
        'accent-hover':   "var(--accent-primary-hover)",
        'accent-subtle':  "var(--accent-subtle)",
        'accent-strong':  "var(--accent-strong)",
        'accent-secondary': "var(--accent-secondary)",
      },
      fontFamily: {
        sans:      ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono:      ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
        serif:     ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        editorial: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        'card':  '10px',
        'modal': '14px',
        'pill':  '9999px',
        'input': '8px',
        'btn':   '8px',
      },
      boxShadow: {
        'soft':          "var(--shadow-sm)",
        'elevated':      "var(--shadow-md)",
        'lifted':        "var(--shadow-lg)",
        'floating':      "var(--shadow-xl)",
        'glow-teal':     "var(--glow-teal)",
        'glow-critical': "var(--glow-critical)",
        'glow-amber':    "var(--glow-amber)",
        'inner-glow':    "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' },  '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'gradient-brand':        "var(--gradient-brand)",
        'gradient-brand-subtle': "var(--gradient-brand-subtle)",
      },
    },
  },
  plugins: [],
}
