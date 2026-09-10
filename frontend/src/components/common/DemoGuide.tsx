import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X, BookOpen, ArrowUpRight } from 'lucide-react';

interface DemoStep {
  step: number;
  title: string;
  description: string;
  highlight: string;
  tab: string;
  action?: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Understand Your Risk',
    description:
      'The Overview shows your organization\'s current cyber risk in financial terms — how much you could potentially lose from cyber incidents.',
    highlight: 'Check the "Estimated Annual Financial Exposure" — this is the key number.',
    tab: 'dashboard',
    action: 'Go to Overview',
  },
  {
    step: 2,
    title: 'See Why Risk Changes With Business Size',
    description:
      'The same cybersecurity vulnerability creates very different financial exposure for a small business vs a large enterprise. Tarazu quantifies this difference.',
    highlight: 'Compare the exposure for the small MSME vs the large enterprise — same vulnerability, very different cost.',
    tab: 'pillar1',
    action: 'Go to Risk by Business Size',
  },
  {
    step: 3,
    title: 'See How Risk Can Spread',
    description:
      'A vulnerability in one system can cascade to connected systems. Click any system node to see which other systems could be affected.',
    highlight: 'Click the HR Laptop node to see how risk spreads through the organization.',
    tab: 'pillar2',
    action: 'Go to Risk Spread View',
  },
  {
    step: 4,
    title: 'Decide Where to Invest',
    description:
      'With limited security budget, where should you spend it? Tarazu recommends the highest-impact security improvements for your specific situation.',
    highlight: 'Try different budget amounts using the slider to see which controls are recommended.',
    tab: 'pillar3',
    action: 'Go to Investment Advisor',
  },
  {
    step: 5,
    title: 'Check Compliance Readiness',
    description:
      'See how your current security posture aligns with regulatory requirements like the Reserve Bank of India Cyber Security Framework (RBI CSF) and ISO 27001.',
    highlight: 'Switch between frameworks to see different compliance views.',
    tab: 'compliance',
    action: 'Go to Compliance',
  },
  {
    step: 6,
    title: 'Simulate What-If Scenarios',
    description:
      'Before spending money on security improvements, simulate the impact. Toggle controls on or off to instantly see how your estimated exposure changes.',
    highlight: 'Toggle EDR on to see how much your exposure could reduce.',
    tab: 'whatif',
    action: 'Go to What-If Analysis',
  },
];

interface DemoGuideProps {
  onNavigate: (tab: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const DemoGuide: React.FC<DemoGuideProps> = ({ onNavigate, onClose, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = DEMO_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === DEMO_STEPS.length - 1;

  const goTo = (tab: string) => {
    onNavigate(tab);
  };

  const next = () => {
    if (!isLast) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      goTo(DEMO_STEPS[nextStep].tab);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (!isFirst) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      goTo(DEMO_STEPS[prevStep].tab);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-ink text-paper rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5" style={{ background: 'rgba(51,65,85,0.5)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
            }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                  Demo Guide
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
                  Step {step.step} of {DEMO_STEPS.length}
                </span>
              </div>

              <h3 className="text-lg font-bold text-paper leading-tight">
                {step.title}
              </h3>
              <p className="text-paper/60 text-xs mt-1.5 leading-relaxed">
                {step.description}
              </p>

              {/* Highlight */}
              <div
                className="mt-3 flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <span className="text-xs" style={{ color: '#60a5fa' }}>→</span>
                <p className="text-xs leading-relaxed font-medium" style={{ color: '#93c5fd' }}>
                  {step.highlight}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-paper/40 hover:text-paper transition p-1 shrink-0"
              aria-label="Close demo guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {DEMO_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentStep(i);
                    goTo(DEMO_STEPS[i].tab);
                  }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === currentStep ? '20px' : '8px',
                    height: '8px',
                    background: i === currentStep
                      ? '#3b82f6'
                      : i < currentStep
                      ? 'rgba(59,130,246,0.35)'
                      : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Go to page */}
              <button
                onClick={() => goTo(step.tab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-white/10 text-paper text-xs font-semibold hover:bg-white/20 transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{step.action}</span>
                <span className="sm:hidden">Go</span>
              </button>

              {!isFirst && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-pill bg-white/10 text-paper text-xs font-semibold hover:bg-white/20 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={next}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: '#ffffff',
                  boxShadow: '0 0 12px rgba(59,130,246,0.3)',
                }}
              >
                <span>{isLast ? 'Finish' : 'Next'}</span>
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Trigger button to launch the demo guide
interface DemoGuideButtonProps {
  onClick: () => void;
}

export const DemoGuideButton: React.FC<DemoGuideButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
    style={{
      background: 'rgba(59,130,246,0.08)',
      border: '1px solid rgba(59,130,246,0.2)',
      color: '#93c5fd',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.35)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.2)';
    }}
  >
    <BookOpen className="w-3.5 h-3.5" />
    <span>Demo Guide</span>
  </button>
);
