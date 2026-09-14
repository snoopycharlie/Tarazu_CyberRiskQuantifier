import React, { useState } from 'react';
import { X, Search, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { Sheet, CVEMatch } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [sheetId, setSheetId] = useState(currentSheetId || (sheets[0]?.id || ''));
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('Server');
  const [criticalityTag, setCriticalityTag] = useState('standard');
  const [revenueDependency, setRevenueDependency] = useState(15.0);

  // Weakness search state
  const [weaknessQuery, setWeaknessQuery] = useState('');
  const [weaknessMatches, setWeaknessMatches] = useState<CVEMatch[]>([]);
  const [searchingWeakness, setSearchingWeakness] = useState(false);

  // Selected weakness
  const [cveId, setCveId] = useState('');
  const [cvssScore, setCvssScore] = useState<number | ''>('');
  const [vulnDesc, setVulnDesc] = useState('');
  const [daysUnpatched, setDaysUnpatched] = useState(45);

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleWeaknessSearch = async () => {
    if (!weaknessQuery.trim()) return;
    try {
      setSearchingWeakness(true);
      const results = await api.searchCve(weaknessQuery.trim());
      setWeaknessMatches(results);
    } catch (err) {
      console.error('Weakness search failed:', err);
    } finally {
      setSearchingWeakness(false);
    }
  };

  const handleSelectWeakness = (match: CVEMatch) => {
    setCveId(match.cve_id);
    setCvssScore(match.cvss_score || '');
    setVulnDesc(match.description);
    setWeaknessMatches([]);
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
      alert(`Could not add system: ${err.message}`);
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
                {t('intake.badge')}
              </span>
              <span className="text-xs text-slate">{t('intake.liveSearch')}</span>
            </div>
            <h2 className="text-2xl font-bold text-ink mt-1">{t('intake.title')}</h2>
          </div>
          <button onClick={onClose} className="text-slate hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Sheet & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate uppercase block mb-1">{t('intake.sheet')}</label>
              <select
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                {sheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate uppercase block mb-1">{t('intake.name')}</label>
              <input
                type="text"
                placeholder={t('intake.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Type & Criticality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate uppercase block mb-1">{t('intake.category')}</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                <option value="Server">Server</option>
                <option value="Database">Database</option>
                <option value="Workstation">Workstation / Laptop</option>
                <option value="Cloud Service">Cloud Service</option>
                <option value="Network Device">Network Device</option>
                <option value="Web App">Web Application</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate uppercase block mb-1">{t('intake.criticality')}</label>
              <select
                value={criticalityTag}
                onChange={(e) => setCriticalityTag(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
              >
                <option value="standard">Standard Internal System</option>
                <option value="payment_processing">Payment Processing (NPCI / SWIFT / UPI)</option>
                <option value="core_db">Core Customer Database</option>
                <option value="customer_portal">Public Customer Web Portal</option>
                <option value="admin_workstation">Privileged Admin Workstation</option>
                <option value="backup_system">Backup / Disaster Recovery</option>
              </select>
            </div>
          </div>

          {/* Revenue Dependency Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-bold text-slate uppercase">{t('intake.revDep')}</label>
              <span className="font-bold text-sienna text-sm">{revenueDependency}{t('intake.revDepVal')}</span>
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

          {/* Weakness Search Section */}
          <div className="p-4 rounded-2xl bg-fog border border-mist space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate uppercase">{t('intake.weakness')}</span>
              <span className="text-[11px] text-slate flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {t('intake.weaknessSearch')}
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t('intake.searchPlaceholder')}
                  value={weaknessQuery}
                  onChange={(e) => setWeaknessQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleWeaknessSearch())}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-mist bg-white text-ink text-xs focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleWeaknessSearch}
                disabled={searchingWeakness || !weaknessQuery.trim()}
                className="px-4 py-2 rounded-xl bg-ink text-paper text-xs font-semibold hover:bg-black transition disabled:opacity-50"
              >
                {searchingWeakness ? t('intake.searching') : t('intake.searchBtn')}
              </button>
            </div>

            {/* Search Results */}
            {weaknessMatches.length > 0 && (
              <div className="p-2 bg-white rounded-xl border border-mist max-h-48 overflow-y-auto space-y-1.5">
                {weaknessMatches.map((m) => (
                  <div
                    key={m.cve_id}
                    onClick={() => handleSelectWeakness(m)}
                    className="p-2 rounded-lg hover:bg-fog cursor-pointer transition flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {m.nvd_url ? (
                          <a
                            href={m.nvd_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="View on NVD"
                            className="font-mono font-bold text-xs text-ink hover:underline"
                          >
                            {m.cve_id}
                          </a>
                        ) : (
                          <span className="font-mono font-bold text-xs text-ink">{m.cve_id}</span>
                        )}
                        {m.cvss_score && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            m.cvss_score >= 9.0 ? 'bg-crimson/15 text-crimson' : 'bg-amber/15 text-amber'
                          }`}>
                            Severity {m.cvss_score}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate line-clamp-1 mt-0.5">{m.description}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-sienna shrink-0">{t('intake.autofill')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Weakness Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate uppercase block mb-1">{t('intake.weaknessId')}</label>
                <input
                  type="text"
                  placeholder={t('intake.weaknessIdPlaceholder')}
                  value={cveId}
                  onChange={(e) => setCveId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-mist bg-white text-ink text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate uppercase block mb-1">{t('intake.severity')}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder={t('intake.severityPlaceholder')}
                  value={cvssScore}
                  onChange={(e) => setCvssScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-mist bg-white text-ink text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate uppercase block mb-1">{t('intake.daysUnpatched')}</label>
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
              {t('intake.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-6 py-2 rounded-pill bg-ink text-paper font-semibold hover:bg-black transition disabled:opacity-50"
            >
              {submitting ? t('intake.submitting') : t('intake.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
