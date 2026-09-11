import React from 'react';
import { ActivityLogItem } from '../../types';
import { X, Clock, User, CheckCircle2, ShieldCheck, FileText, CreditCard, Tag } from 'lucide-react';

interface ActivityTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  activities?: ActivityLogItem[];
}

export const ActivityTimelineModal: React.FC<ActivityTimelineModalProps> = ({
  isOpen,
  onClose,
  title,
  code,
  activities = []
}) => {
  if (!isOpen) return null;

  // Default mock timeline if empty
  const displayActivities: ActivityLogItem[] = activities.length > 0 ? activities : [
    {
      id: 'act-1',
      timestamp: '2026-08-12 08:30',
      user: 'Budi Santoso',
      action: 'created Sales Order',
      details: 'Draft dibuat via portal sales'
    },
    {
      id: 'act-2',
      timestamp: '2026-08-12 09:15',
      user: 'Budi Santoso',
      action: 'added Discount 3',
      details: 'Diskon bertingkat 10% + Rp 5.000 + 2.5% applied'
    },
    {
      id: 'act-3',
      timestamp: '2026-08-12 10:00',
      user: 'Admin ERP',
      action: 'changed Payment Term',
      details: 'Diubah dari Cash menjadi TOP 30 Hari'
    },
    {
      id: 'act-4',
      timestamp: '2026-08-12 10:45',
      user: 'Andi Wijaya',
      action: 'approved Sales Order',
      details: 'Otorisasi batas kredit toko disetujui'
    },
    {
      id: 'act-5',
      timestamp: '2026-08-12 11:30',
      user: 'Finance Staff',
      action: 'recorded payment',
      details: 'Penerimaan DP via Transfer Bank BCA'
    }
  ];

  const getIconForAction = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create')) return <FileText className="w-4 h-4 text-blue-600" />;
    if (act.includes('approve')) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (act.includes('discount')) return <Tag className="w-4 h-4 text-purple-600" />;
    if (act.includes('term')) return <Clock className="w-4 h-4 text-amber-600" />;
    if (act.includes('payment') || act.includes('record')) return <CreditCard className="w-4 h-4 text-indigo-600" />;
    return <ShieldCheck className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Audit Log & Activity Timeline</h3>
              <p className="text-[11px] text-slate-300 font-mono">{title} — {code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {displayActivities.map((item, index) => (
              <div key={item.id || index} className="relative pl-6">
                {/* Node Dot */}
                <div className="absolute -left-[17px] top-0 p-1 bg-white border-2 border-slate-300 rounded-full shadow-xs">
                  {getIconForAction(item.action)}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {item.user}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                  </div>
                  <p className="text-xs font-semibold text-blue-700">
                    {item.user} {item.action}
                  </p>
                  {item.details && (
                    <p className="text-[11px] text-slate-600 mt-1 bg-white p-1.5 rounded border border-slate-100 font-sans">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
