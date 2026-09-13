import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Zap, Shield, BarChart3, Activity } from 'lucide-react';
import { authLogin, DemoUser } from '../../utils/auth';

interface LoginPageProps {
  onLogin: (user: DemoUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = authLogin(email, password);
    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleDemoAccess = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = authLogin('admin@tarazu.demo', 'tarazu2026');
    setLoading(false);
    if (result.success && result.user) onLogin(result.user);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── LEFT PANEL — Branding ───────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: '#080E1A' }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,212,196,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,196,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial glow from bottom-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-80px',
            right: '-80px',
            width: '480px',
            height: '480px',
            background: 'radial-gradient(circle, rgba(0,196,180,0.12) 0%, transparent 70%)',
          }}
        />
        {/* Secondary glow top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-40px',
            left: '-40px',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(245,124,0,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00D4C4 0%, #00C4B4 100%)',
                boxShadow: '0 4px 16px rgba(0,212,196,0.40)',
              }}
            >
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>Tarazu</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-0.5" style={{ color: 'rgba(0,212,196,0.7)' }}>
                Risk Platform
              </p>
            </div>
          </div>
        </div>

        {/* Core Message */}
        <div className="relative z-10 max-w-md">
          <p
            className="text-xs font-semibold uppercase tracking-[0.12em] mb-4"
            style={{ color: 'rgba(0,212,196,0.7)' }}
          >
            Cyber Risk Quantification
          </p>
          <h1
            className="text-5xl font-bold leading-tight mb-6"
            style={{ color: '#E8F1FB', letterSpacing: '-0.04em' }}
          >
            Translate Risk<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #00D4C4 0%, #00C4B4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              into Numbers.
            </span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(127,168,204,0.85)' }}>
            Translate complex vulnerabilities into clear financial exposure
            — to drive smarter, data-driven security investments.
          </p>

          {/* Feature callouts */}
          <div className="mt-8 space-y-3">
            {[
              { icon: BarChart3, text: 'FAIR-calibrated financial risk quantification' },
              { icon: Shield,    text: 'RBI CSF · ISO 27001 · NIST CSF compliance mapping' },
              { icon: Activity,  text: 'Real-time NIST NVD API v2.0 threat intelligence' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,212,196,0.10)', border: '1px solid rgba(0,212,196,0.20)' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: '#00D4C4' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(127,168,204,0.8)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="relative z-10 flex items-center justify-between text-xs" style={{ color: 'rgba(61,91,122,0.8)' }}>
          <span>Enterprise Cyber Risk Management</span>
          <span className="font-mono">SIH26105</span>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────────────────── */}
      <div
        className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-12"
        style={{ background: 'var(--bg-page)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00D4C4 0%, #00C4B4 100%)',
                boxShadow: '0 2px 8px rgba(0,196,180,0.30)',
              }}
            >
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Tarazu
            </span>
          </div>

          <div className="mb-8">
            <p className="page-eyebrow mb-2">Welcome back</p>
            <h2
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}
            >
              Sign in
            </h2>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Enter your details to access the platform.
            </p>
          </div>

          {/* Demo Access */}
          <div
            className="mb-7 p-4 rounded-xl"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-primary)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Demo Access
                </span>
              </div>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                admin@tarazu.demo
              </span>
            </div>
            <button
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold border transition-all flex justify-center items-center"
              style={{
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                background: 'transparent',
                height: '44px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-strong)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {loading ? 'Authenticating…' : 'Quick Demo Login'}
            </button>
          </div>

          <div className="flex items-center gap-4 mb-7">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>or sign in manually</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Work Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cyber-input pl-11"
                  style={{ height: '48px' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input pl-11 pr-11"
                  style={{ height: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: 'var(--risk-critical-bg)',
                  border: '1px solid var(--risk-critical-border)',
                  color: 'var(--risk-critical)',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm"
              style={{ height: '48px', marginTop: '4px' }}
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  );
};
