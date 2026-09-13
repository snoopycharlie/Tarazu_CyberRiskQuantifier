import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Building2 } from 'lucide-react';
import { Organization } from '../../types';
import { api } from '../../services/api';
import { backdropVariants, modalVariants } from '../../utils/animations';

interface NewOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrgCreated: (org: Organization) => void;
}

export const NewOrgModal: React.FC<NewOrgModalProps> = ({
  isOpen,
  onClose,
  onOrgCreated,
}) => {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('BFSI');
  const [sizeTier, setSizeTier] = useState('Mid');
  const [employees, setEmployees] = useState(500);
  const [revenueCr, setRevenueCr] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const newOrg = await api.createOrganization({
        name: name.trim(),
        sector,
        size_tier: sizeTier,
        employee_count: Number(employees),
        annual_revenue_inr: Number(revenueCr) * 10000000,
      });
      onOrgCreated(newOrg);
      onClose();
    } catch (err: any) {
      alert(`Failed to create organization: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,14,26,0.70)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="tarazu-modal max-w-md w-full"
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)' }}
                >
                  <Building2 className="w-4.5 h-4.5" style={{ color: 'var(--accent-primary)', width: '18px', height: '18px' }} />
                </div>
                <div>
                  <p className="page-eyebrow mb-0.5">Organization</p>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    New Organization Profile
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex FinCorp Technologies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="cyber-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="cyber-select"
                  >
                    <option value="BFSI">BFSI (Banking & FinTech)</option>
                    <option value="Healthcare">Healthcare & Pharma</option>
                    <option value="Manufacturing">Manufacturing & OT</option>
                    <option value="IT-SaaS">IT & SaaS</option>
                    <option value="Other">Other / Services</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Scale Tier
                  </label>
                  <select
                    value={sizeTier}
                    onChange={(e) => setSizeTier(e.target.value)}
                    className="cyber-select"
                  >
                    <option value="MSME">MSME</option>
                    <option value="Mid">Mid-Market</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Employees
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={employees}
                    onChange={(e) => setEmployees(Number(e.target.value))}
                    className="cyber-input"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Annual Revenue (₹ Cr)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={revenueCr}
                    onChange={(e) => setRevenueCr(Number(e.target.value))}
                    className="cyber-input"
                  />
                </div>
              </div>

              <div
                className="flex justify-end gap-3 pt-4"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="btn-primary"
                >
                  {submitting ? 'Creating…' : 'Create Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
