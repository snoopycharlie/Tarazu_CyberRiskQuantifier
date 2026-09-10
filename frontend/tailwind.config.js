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
        // Map legacy semantic names to CSS variables
        ink:    "var(--text-primary)", 
        paper:  "var(--bg-surface)", 
        fog:    "var(--bg-page)", 
        mist:   "var(--border-subtle)", 
        
        slate:  "var(--text-secondary)", 
        ash:    "var(--text-secondary)", 
        smoke:  "var(--text-muted)", 
        
        sienna: "var(--accent-primary)", 
        peach:  "var(--accent-subtle)", 
        
        crimson: "var(--risk-critical)",
        amber:   "var(--risk-high)",
        emerald: "var(--risk-low)",
        
        // Explicit semantic names going forward
        'cyber-blue':   "var(--accent-primary)",
        'cyber-cyan':   "var(--accent-primary)",
        'cyber-purple': "var(--accent-primary)",
        
        'surface-1':    "var(--bg-surface)",
        'surface-2':    "var(--bg-surface-hover)",
        'surface-3':    "var(--bg-elevated)",
        
        'border-dim':   "var(--border-subtle)",
        'border-soft':  "var(--border-strong)",
        
        'text-primary': "var(--text-primary)",
        'text-secondary': "var(--text-secondary)",
        'text-muted':   "var(--text-muted)",
        
        // Risk level colors
        'risk-critical': "var(--risk-critical)",
        'risk-high':     "var(--risk-high)",
        'risk-medium':   "var(--risk-medium)",
        'risk-low':      "var(--risk-low)",
      },
      fontFamily: {
        sans:  ["Inter", "-apple-system", "BlinkMacSystemFont", "ui-sans-serif", "sans-serif"],
        mono:  ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
        // Enforce Inter for editorial/serif to match modern premium SaaS look
        serif: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        'card': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft':     "var(--shadow-sm)",
        'elevated': "var(--shadow-md)",
        'glow-blue':  '0 0 20px var(--accent-subtle)',
        'glow-red':   '0 0 20px var(--risk-critical-bg)',
        'glow-amber': '0 0 20px var(--risk-high-bg)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
