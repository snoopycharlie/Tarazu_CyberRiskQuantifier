import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { Organization } from '../../types';
import { api } from '../../services/api';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-mist shadow-elevated animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-mist">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sienna" />
            <h3 className="text-xl font-bold text-ink">New Organization Profile</h3>
          </div>
          <button onClick={onClose} className="text-slate hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="font-bold text-slate uppercase block mb-1">Organization Name</label>
            <input
              type="text"
              placeholder="e.g. Apex FinCorp Technologies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                <option value="BFSI">BFSI (Banking & FinTech)</option>
                <option value="Healthcare">Healthcare & Pharma</option>
                <option value="Manufacturing">Manufacturing & OT</option>
                <option value="IT-SaaS">IT & SaaS</option>
                <option value="Other">Other / Services</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Scale Tier</label>
              <select
                value={sizeTier}
                onChange={(e) => setSizeTier(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                <option value="MSME">MSME</option>
                <option value="Mid">Mid-Market</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Employees</label>
              <input
                type="number"
                min="1"
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Annual Revenue (₹ Cr)</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={revenueCr}
                onChange={(e) => setRevenueCr(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-mist">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-pill bg-fog border border-mist text-slate hover:text-ink font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-6 py-2 rounded-pill bg-ink text-paper font-semibold hover:bg-black transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
