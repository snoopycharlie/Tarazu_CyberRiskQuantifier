import React from 'react';
import { X, Printer, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  orgId,
}) => {
  if (!isOpen) return null;

  const reportUrl = api.getAuditReportUrl(orgId);

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] border border-mist shadow-elevated flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-mist bg-fog flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-peach text-sienna uppercase tracking-wider">
              EXECUTIVE BOARD AUDIT EXPORT
            </span>
            <h3 className="font-editorial text-xl font-bold text-ink mt-0.5">
              Printable Cyber Risk Quantification Audit
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-pill bg-fog border border-mist text-xs font-semibold text-slate hover:text-ink transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
            <button
              onClick={() => {
                const iframe = document.getElementById('report-iframe') as HTMLIFrameElement;
                if (iframe?.contentWindow) {
                  iframe.contentWindow.print();
                }
              }}
              className="px-4 py-1.5 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="text-slate hover:text-ink p-1 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Preview Frame */}
        <div className="flex-1 bg-fog">
          <iframe
            id="report-iframe"
            src={reportUrl}
            title="Executive Audit Report"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
