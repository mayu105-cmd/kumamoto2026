import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EvacueeRecord } from '../../types';

interface ReissuePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: EvacueeRecord[];
  onSelectRecord: (record: EvacueeRecord) => void;
}

export const ReissuePassModal: React.FC<ReissuePassModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
}) => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<EvacueeRecord[]>([]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().replace(/-/g, '');
    if (!q) return;

    const filtered = records.filter(r => {
      const cleanPhone = r.phone.replace(/-/g, '');
      const matchPhone = cleanPhone.includes(q);
      const matchName = r.name.includes(q) || (r.nameKana && r.nameKana.includes(q));
      const matchId = r.id.toLowerCase().includes(q.toLowerCase());
      const matchPlate = r.vehicle.numberPlate.replace(/\s+/g, '').includes(q);
      return matchPhone || matchName || matchId || matchPlate;
    });

    setResults(filtered);
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">受付証（会員証）の再表示</h3>
            <p className="text-xs text-slate-500">
              ブラウザを閉じた場合も、登録時の情報で再表示できます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            電話番号、お名前、または車両ナンバーを入力
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="例: 09012345678 または 熊本太郎"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shrink-0 shadow-sm"
            >
              検索する
            </button>
          </div>
        </form>

        {/* 検索結果 */}
        <div className="mt-5 max-h-64 overflow-y-auto space-y-2">
          {hasSearched && results.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              一致する登録情報が見つかりませんでした。<br />
              電話番号の数字（ハイフンなし）やお名前で再度お試しください。
            </div>
          )}

          {results.map(r => (
            <div
              key={r.id}
              onClick={() => {
                onSelectRecord(r);
                onClose();
              }}
              className="p-3.5 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{r.name} 様</span>
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    区画 No.{r.slotNumber}
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    {r.facilityId === 'aquadome' ? 'アクアドーム' : '熊本競輪場'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>TEL: {r.phone}</span>
                  <span>車両: {r.vehicle.model} ({r.vehicle.numberPlate})</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-blue-600 group-hover:underline">
                  表示する
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

