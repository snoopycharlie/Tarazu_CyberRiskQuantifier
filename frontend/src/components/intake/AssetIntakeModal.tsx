import React, { useState } from 'react';
import { X, Search, ShieldAlert, Cpu, Sparkles, Check } from 'lucide-react';
import { Sheet, CVEMatch } from '../../types';
import { api } from '../../services/api';

interface AssetIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: Sheet[];
  currentSheetId?: string;
  onAssetCreated: () => void;
}

export const AssetIntakeModal: React.FC<AssetIntakeModalProps> = ({
  isOpen,
  onClose,
  sheets,
  currentSheetId,
  onAssetCreated,
}) => {
  const [sheetId, setSheetId] = useState(currentSheetId || (sheets[0]?.id || ''));
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('Server');
  const [criticalityTag, setCriticalityTag] = useState('standard');
  const [revenueDependency, setRevenueDependency] = useState(15.0);

  // Vulnerability & CVE lookup state
  const [cveSearchQuery, setCveSearchQuery] = useState('');
  const [cveMatches, setCveMatches] = useState<CVEMatch[]>([]);
  const [searchingCve, setSearchingCve] = useState(false);

  // Selected vuln
  const [cveId, setCveId] = useState('');
  const [cvssScore, setCvssScore] = useState<number | ''>('');
  const [vulnDesc, setVulnDesc] = useState('');
  const [daysUnpatched, setDaysUnpatched] = useState(45);

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCveSearch = async () => {
    if (!cveSearchQuery.trim()) return;
    try {
      setSearchingCve(true);
      const results = await api.searchCve(cveSearchQuery.trim());
      setCveMatches(results);
    } catch (err) {
      console.error('CVE search failed:', err);
    } finally {
      setSearchingCve(false);
    }
  };

  const handleSelectCve = (match: CVEMatch) => {
    setCveId(match.cve_id);
    setCvssScore(match.cvss_score || '');
    setVulnDesc(match.description);
    setCveMatches([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sheetId) return;

    try {
      setSubmitting(true);
      await api.createAssetGuided({
        sheet_id: sheetId,
        name: name.trim(),
        asset_type: assetType,
        criticality_tag: criticalityTag,
        revenue_dependency_pct: Number(revenueDependency),
        cve_id: cveId || null,
        cvss_score: cvssScore !== '' ? Number(cvssScore) : null,
        vuln_description: vulnDesc,
        days_unpatched: Number(daysUnpatched),
      });

      onAssetCreated();
      onClose();
    } catch (err: any) {
      alert(`Asset intake failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-mist shadow-elevated animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-mist">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-peach text-sienna tracking-wide">
                GUIDED INTAKE
              </span>
              <span className="text-xs text-slate">NIST NVD Live Auto-Match</span>
            </div>
            <h2 className="text-2xl font-bold text-ink mt-1">Register Monitored Asset</h2>
          </div>
          <button onClick={onClose} className="text-slate hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Target Sheet & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Target Infrastructure Sheet</label>
              <select
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                {sheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Asset Name</label>
              <input
                type="text"
                placeholder="e.g. Core Oracle Transaction DB"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Type & Criticality Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Asset Category</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                <option value="Server">Server</option>
                <option value="Database">Database</option>
                <option value="Workstation">Workstation</option>
                <option value="Cloud Service">Cloud Service</option>
                <option value="Network Device">Network Device</option>
                <option value="Web App">Web Application</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate uppercase block mb-1">Business Criticality Tag</label>
              <select
                value={criticalityTag}
                onChange={(e) => setCriticalityTag(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                <option value="standard">Standard Internal Resource</option>
                <option value="payment_processing">Payment Processing (NPCI/SWIFT/UPI)</option>
                <option value="core_db">Core Customer Database</option>
                <option value="customer_portal">Public Customer Web Portal</option>
                <option value="admin_workstation">Privileged Admin Workstation</option>
                <option value="backup_system">Backup / Disaster Recovery Node</option>
              </select>
            </div>
          </div>

          {/* Revenue Dependency Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-bold text-slate uppercase">Revenue Dependency Exposure</label>
              <span className="font-bold text-sienna text-sm">{revenueDependency}% Revenue Impact</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={revenueDependency}
              onChange={(e) => setRevenueDependency(Number(e.target.value))}
              className="w-full h-2 bg-mist rounded-lg appearance-none cursor-pointer accent-sienna"
            />
          </div>

          {/* Live NIST NVD CVE Lookup Section */}
          <div className="p-4 rounded-2xl bg-fog border border-mist space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate uppercase">Attach Known Vulnerability (Optional)</span>
              <span className="text-[11px] text-slate">Live NIST NVD v2.0 API Lookup</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search software (e.g. Citrix, FortiOS, Log4j, Exchange, Apache)..."
                  value={cveSearchQuery}
                  onChange={(e) => setCveSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCveSearch())}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-mist bg-white text-ink text-xs focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCveSearch}
                disabled={searchingCve || !cveSearchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-ink text-paper text-xs font-semibold hover:bg-black transition disabled:opacity-50"
              >
                {searchingCve ? 'Searching...' : 'NVD Match'}
              </button>
            </div>

            {/* Match Results dropdown */}
            {cveMatches.length > 0 && (
              <div className="p-2 bg-white rounded-xl border border-mist max-h-48 overflow-y-auto space-y-1.5">
                {cveMatches.map((m) => (
                  <div
                    key={m.cve_id}
                    onClick={() => handleSelectCve(m)}
                    className="p-2 rounded-lg hover:bg-fog cursor-pointer transition flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-ink">{m.cve_id}</span>
                        {m.cvss_score && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            m.cvss_score >= 9.0 ? 'bg-crimson/15 text-crimson' : 'bg-amber/15 text-amber'
                          }`}>
                            CVSS {m.cvss_score}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate line-clamp-1 mt-0.5">{m.description}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-sienna shrink-0">Auto-fill</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected CVE Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate uppercase block mb-1">CVE Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. CVE-2023-4966"
                  value={cveId}
                  onChange={(e) => setCveId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-mist bg-white text-ink text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate uppercase block mb-1">CVSS Base Score (0-10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 9.4"
                  value={cvssScore}
                  onChange={(e) => setCvssScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-mist bg-white text-ink text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate uppercase block mb-1">Days Unpatched</label>
                <input
                  type="number"
                  min="0"
                  value={daysUnpatched}
                  onChange={(e) => setDaysUnpatched(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-mist bg-white text-ink text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
              {submitting ? 'Registering & Quantifying...' : 'Add Asset & Compute EAL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
