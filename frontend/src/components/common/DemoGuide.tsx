import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, BookOpen, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { slideUpVariants } from '../../utils/animations';

interface TutorialStep {
  step: number;
  title: string;
  description: string;
  highlight: string;
  tab: string;
  action?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 1,
    title: 'Understand Your Risk',
    description:
      "The Overview shows your organization's current cyber risk in financial terms — how much you could potentially lose from cyber incidents.",
    highlight: 'Check the "Estimated Annual Financial Exposure" — this is the key number.',
    tab: 'dashboard',
    action: 'Go to Overview',
  },
  {
    step: 2,
    title: 'See Why Risk Changes With Business Size',
    description:
      'The same security weakness creates very different financial exposure for a small business vs a large enterprise. Tarazu quantifies this difference.',
    highlight: 'Compare the exposure for the small MSME vs the large enterprise — same weakness, very different cost.',
    tab: 'pillar1',
    action: 'Go to Risk by Business Size',
  },
  {
    step: 3,
    title: 'See How Risk Can Spread',
    description:
      'A weakness in one system can cascade to connected systems. Click any system node to see which other systems could be affected.',
    highlight: 'Click the HR Laptop node to see how risk spreads through the organization.',
    tab: 'pillar2',
    action: 'Go to Risk Spread View',
  },
  {
    step: 4,
    title: 'Decide Where to Invest',
    description:
      'With limited security budget, where should you spend it? Tarazu recommends the highest-impact security improvements for your specific situation.',
    highlight: 'Try different budget amounts using the slider to see which improvements are recommended.',
    tab: 'pillar3',
    action: 'Go to Investment Advisor',
  },
  {
    step: 5,
    title: 'Check Compliance Readiness',
    description:
      'See how your current security posture aligns with regulatory requirements like the Reserve Bank of India Cyber Security Framework (RBI CSF), ISO 27001, and HIPAA.',
    highlight: 'Switch between frameworks to see different compliance views.',
    tab: 'compliance',
    action: 'Go to Compliance',
  },
  {
    step: 6,
    title: 'Simulate What-If Scenarios',
    description:
      'Before spending money on security improvements, simulate the impact. Toggle controls on or off to instantly see how your estimated exposure changes.',
    highlight: 'Toggle endpoint protection on to see how much your exposure could reduce.',
    tab: 'whatif',
    action: 'Go to What-If Analysis',
  },
];

interface TutorialProps {
  onNavigate: (tab: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const DemoGuide: React.FC<TutorialProps> = ({ onNavigate, onClose, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const goTo = (tab: string) => { onNavigate(tab); };

  const next = () => {
    if (!isLast) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      goTo(TUTORIAL_STEPS[nextStep].tab);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (!isFirst) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      goTo(TUTORIAL_STEPS[prevStep].tab);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={slideUpVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#0F1929',
              border: '1px solid rgba(0,212,196,0.15)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Progress bar */}
            <div className="h-0.5" style={{ background: 'rgba(28,46,69,0.8)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4C4, #009E90)' }}
                animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: '#00D4C4' }}
                    >
                      {t('tutorial.header')}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(127,168,204,0.4)' }}>
                      {t('tutorial.step')} {step.step} {t('tutorial.of')} {TUTORIAL_STEPS.length}
                    </span>
                  </div>

                  <h3
                    className="text-base font-bold leading-tight"
                    style={{ color: '#E8F1FB' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-xs mt-1.5 leading-relaxed"
                    style={{ color: 'rgba(127,168,204,0.75)' }}
                  >
                    {step.description}
                  </p>

                  {/* Highlight */}
                  <div
                    className="mt-3 flex items-start gap-2 p-3 rounded-xl"
                    style={{
                      background: 'rgba(0,212,196,0.06)',
                      border: '1px solid rgba(0,212,196,0.15)',
                    }}
                  >
                    <span className="text-xs shrink-0 mt-0.5" style={{ color: '#00D4C4' }}>→</span>
                    <p className="text-xs leading-relaxed font-medium" style={{ color: 'rgba(0,212,196,0.85)' }}>
                      {step.highlight}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: 'rgba(127,168,204,0.5)' }}
                  aria-label="Close tutorial"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#E8F1FB'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(127,168,204,0.5)'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Controls */}
              <div
                className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: '1px solid rgba(28,46,69,0.8)' }}
              >
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentStep(i); goTo(TUTORIAL_STEPS[i].tab); }}
                      className="rounded-full transition-all"
                      style={{
                        width: i === currentStep ? '20px' : '7px',
                        height: '7px',
                        background: i === currentStep
                          ? '#00D4C4'
                          : i < currentStep
                          ? 'rgba(0,212,196,0.30)'
                          : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Go to page */}
                  <button
                    onClick={() => goTo(step.tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      color: '#E8F1FB',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{step.action}</span>
                    <span className="sm:hidden">Go</span>
                  </button>

                  {!isFirst && (
                    <button
                      onClick={prev}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        color: '#E8F1FB',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{t('tutorial.back')}</span>
                    </button>
                  )}

                  <button
                    onClick={next}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #00D4C4 0%, #009E90 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,212,196,0.35)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    <span>{isLast ? t('tutorial.finish') : t('tutorial.next')}</span>
                    {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Trigger button to launch the tutorial
interface TutorialButtonProps {
  onClick: () => void;
}

export const DemoGuideButton: React.FC<TutorialButtonProps> = ({ onClick }) => {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-primary)',
        color: 'var(--accent-primary)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-subtle)';
      }}
    >
      <BookOpen className="w-3.5 h-3.5" />
      <span>{t('tutorial.label')}</span>
    </button>
  );
};
