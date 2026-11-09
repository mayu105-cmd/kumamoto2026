import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EvacueeRecord, HealthStatus, HealthSymptom, DailyCheckinLog } from '../../types';
import { SYMPTOM_OPTIONS } from '../../utils/constants';

interface HealthUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EvacueeRecord;
  onUpdate: (updated: EvacueeRecord) => void;
}

export const HealthUpdateModal: React.FC<HealthUpdateModalProps> = ({
  isOpen,
  onClose,
  record,
  onUpdate,
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(record.healthStatus);
  const [healthSymptoms, setHealthSymptoms] = useState<HealthSymptom[]>(record.healthSymptoms);
  const [healthNote, setHealthNote] = useState(record.healthNote || '');

  if (!isOpen) return null;

  const handleToggleSymptom = (symptom: HealthSymptom) => {
    setHealthSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const log: DailyCheckinLog = {
      id: 'ck-' + Date.now(),
      checkinAt: now,
      healthStatus,
      healthSymptoms,
      healthNote: healthNote.trim() || undefined,
      aidNeeds: record.aidNeeds,
      aidNeedsNote: record.aidNeedsNote,
    };

    const updated: EvacueeRecord = {
      ...record,
      healthStatus,
      healthSymptoms,
      healthNote: healthNote.trim() || undefined,
      lastHealthCheckAt: now,
      lastDailyCheckinAt: now,
      checkinHistory: [...(record.checkinHistory || []), log],
      updatedAt: now,
      // 体調不良の場合は見回りステータスを要確認にする
      patrolStatus: (healthStatus === 'bad' || healthSymptoms.includes('leg_swelling') || healthSymptoms.includes('breathing_difficulty'))
        ? 'needs_attention'
        : record.patrolStatus,
    };
    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">健康状態・症状の再申告</h3>
            <p className="text-xs text-slate-500">
              体調の変化があれば更新してください（現地救護班へ即時連携）
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              現在の体調レベル
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'good', label: '良好', active: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
                { id: 'caution', label: '要注意・だるさ', active: 'border-amber-600 bg-amber-50 text-amber-900' },
                { id: 'bad', label: '体調不良・痛み', active: 'border-red-600 bg-red-50 text-red-900' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHealthStatus(opt.id as HealthStatus)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    healthStatus === opt.id ? `${opt.active} ring-2 ring-offset-1` : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              気になる症状（エコノミークラス症候群警戒）:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {SYMPTOM_OPTIONS.map(opt => {
                const isChecked = healthSymptoms.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
                      isChecked
                        ? opt.severe
                          ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                          : 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSymptom(opt.id)}
                      className="rounded text-blue-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              現在の症状の詳しいメモ
            </label>
            <textarea
              rows={2}
              value={healthNote}
              onChange={e => setHealthNote(e.target.value)}
              placeholder="例: 右足が腫れて痛む、歩くと息苦しい等"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center"
          >
            <span>体調情報を更新する</span>
          </button>
        </div>
      </div>
    </div>
  );
};

