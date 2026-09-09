import React, { useState } from 'react';
import { Scale, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, TrendingDown, Network } from 'lucide-react';
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
    // Simulate network delay for realism
    await new Promise((r) => setTimeout(r, 600));

    const result = authLogin(email, password);
    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleQuickLogin = async (e: React.MouseEvent, preset: 'admin' | 'judge') => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const creds =
      preset === 'admin'
        ? { email: 'admin@tarazu.demo', password: 'tarazu2026' }
        : { email: 'judge@sih.demo', password: 'sih2026' };
    const result = authLogin(creds.email, creds.password);
    setLoading(false);
    if (result.success && result.user) onLogin(result.user);
  };

  return (
    <div className="min-h-screen bg-fog flex">
      {/* Left Panel — Branding & Product Story */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-sienna flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-peach" />
            </div>
            <div>
              <span className="font-editorial text-3xl font-bold text-paper tracking-tight">Tarazu</span>
              <p className="text-paper/50 text-xs">Continuous Cyber Risk Financial Quantification</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="font-editorial text-5xl font-bold text-paper leading-tight tracking-tight">
                Understand your
                <span className="text-peach block">cyber risk</span>
                in financial terms.
              </h1>
              <p className="text-paper/60 text-base mt-4 leading-relaxed max-w-md">
                Tarazu translates complex cybersecurity vulnerabilities into clear financial exposure estimates — 
                helping business leaders make smarter security investment decisions.
              </p>
            </div>

            {/* Three pillars */}
            <div className="space-y-4">
              {[
                {
                  icon: TrendingDown,
                  title: 'Risk Changes With Business Size',
                  desc: 'Same vulnerability, different financial impact based on your organization.',
                },
                {
                  icon: Network,
                  title: 'See How Risk Can Spread',
                  desc: 'Understand which connected systems are at risk if one is compromised.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Decide Where to Invest',
                  desc: 'AI-supported recommendations for maximum security return on investment.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-paper/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-peach" />
                  </div>
                  <div>
                    <h3 className="text-paper text-sm font-semibold">{item.title}</h3>
                    <p className="text-paper/50 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-paper/30 text-xs">
          <span>SIH26105 · Smart India Hackathon 2026</span>
          <span>Rules-Before-AI Architecture · FAIR-Calibrated</span>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sienna flex items-center justify-center">
              <Scale className="w-5 h-5 text-peach" />
            </div>
            <span className="font-editorial text-2xl font-bold text-ink">Tarazu</span>
          </div>

          <div>
            <h2 className="font-editorial text-3xl font-bold text-ink">Sign in</h2>
            <p className="text-slate text-sm mt-1">Access your cyber risk dashboard.</p>
          </div>

          {/* Quick Login Cards for Demo */}
          <div className="p-4 rounded-2xl bg-peach/40 border border-sienna/20 space-y-3">
            <p className="text-xs font-bold text-sienna uppercase tracking-wider">
              Demo Credentials — Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => handleQuickLogin(e, 'admin')}
                disabled={loading}
                className="p-3 rounded-xl bg-white/70 border border-sienna/20 text-left hover:bg-white transition group"
              >
                <div className="text-xs font-bold text-sienna group-hover:text-ink transition">Risk Analyst</div>
                <div className="text-[11px] text-slate mt-0.5">admin@tarazu.demo</div>
              </button>
              <button
                onClick={(e) => handleQuickLogin(e, 'judge')}
                disabled={loading}
                className="p-3 rounded-xl bg-white/70 border border-sienna/20 text-left hover:bg-white transition group"
              >
                <div className="text-xs font-bold text-sienna group-hover:text-ink transition">SIH Judge</div>
                <div className="text-[11px] text-slate mt-0.5">judge@sih.demo</div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-mist" />
            <span className="text-xs text-slate font-medium">or sign in manually</span>
            <div className="flex-1 h-px bg-mist" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-mist bg-white text-ink text-sm font-medium focus:outline-none focus:border-sienna/50 focus:ring-2 focus:ring-sienna/10 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-mist bg-white text-ink text-sm font-medium focus:outline-none focus:border-sienna/50 focus:ring-2 focus:ring-sienna/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-ink transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
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

          <p className="text-center text-xs text-slate">
            Tarazu · AI-Powered Cyber Risk Platform ·{' '}
            <span className="font-semibold text-sienna">SIH26105</span>
          </p>
        </div>
      </div>
    </div>
  );
};
