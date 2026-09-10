import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Zap } from 'lucide-react';
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
    <div className="min-h-screen flex bg-fog">
      {/* ── LEFT PANEL — Minimal Branding ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden bg-[#0B1220]">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyber-blue shadow-soft">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Tarazu</span>
          </div>
        </div>

        {/* Core Message */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
            Cyber Risk.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-cyan">Quantified.</span>
          </h1>
          <p className="text-lg text-slate-400">
            Translate complex vulnerabilities into clear financial exposure to drive smarter security investments.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500 flex justify-between">
          <span>Enterprise Risk Management</span>
          <span>SIH26105</span>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-page">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyber-blue shadow-soft">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-ink tracking-tight">Tarazu</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-ink tracking-tight">Sign in</h2>
            <p className="text-slate mt-2 text-base">Enter your details to access the platform.</p>
          </div>

          {/* Demo Access */}
          <div className="mb-8 p-5 rounded-xl border border-cyber-blue/20 bg-cyber-blue/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyber-blue" />
                <span className="text-sm font-semibold uppercase tracking-wider text-cyber-blue">Demo Access</span>
              </div>
              <span className="text-xs text-slate">admin@tarazu.demo</span>
            </div>
            <button
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full mt-3 py-3 rounded-lg text-sm font-semibold border border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all flex justify-center items-center h-[48px]"
            >
              {loading ? 'Authenticating...' : 'Quick Demo Login'}
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-mist" />
            <span className="text-sm font-medium text-slate">or sign in manually</span>
            <div className="flex-1 h-px bg-mist" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-ink mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-smoke pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cyber-input pl-12 h-[52px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-ink mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-smoke pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input pl-12 pr-12 h-[52px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-smoke hover:text-slate transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-risk-critical-bg border border-risk-critical-border text-risk-critical">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-[52px] text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  );
};
