import React, { useState } from 'react';
import { EvacueeRecord, AdminUser } from '../../types';
import { AID_NEEDS_OPTIONS } from '../../utils/constants';

interface AidDistributorProps {
  records: EvacueeRecord[];
  adminUser: AdminUser | null;
  onUpdateRecord: (updated: EvacueeRecord) => void;
}

export const AidDistributor: React.FC<AidDistributorProps> = ({
  records,
  adminUser,
  onUpdateRecord,
}) => {
  const [scanQuery, setScanQuery] = useState('');
  const [matchedRecord, setMatchedRecord] = useState<EvacueeRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState('おにぎり・食料セット');
  const [customItem, setCustomItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessNotice(null);
    const q = scanQuery.trim();
    if (!q) return;

    // QRのJSONペイロードまたはIDまたは区画番号または車番で照合
    let targetId = q;
    try {
      if (q.startsWith('{')) {
        const parsed = JSON.parse(q);
        if (parsed.id) targetId = parsed.id;
      }
    } catch {
      // ignore
    }

    const found = records.find(r =>
      r.id.toLowerCase() === targetId.toLowerCase() ||
      r.phone.replace(/-/g, '') === targetId.replace(/-/g, '') ||
      r.vehicle.numberPlate.includes(targetId) ||
      r.slotNumber.toString() === targetId
    );

    if (found) {
      setMatchedRecord(found);
      setQuantity(found.passengerCount || 1); // 同乗者分の数量をデフォルト
    } else {
      setMatchedRecord(null);
      alert('該当する避難者が見つかりませんでした。番号をご確認ください。');
    }
  };

  const handleDistribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedRecord) return;

    const itemLabel = customItem.trim() || selectedItem;
    const itemFull = `${itemLabel} (${quantity}人分)`;

    const newDist = {
      id: 'dist-' + Date.now(),
      item: itemFull,
      distributedAt: new Date().toISOString(),
      staffName: adminUser?.name || '物資配布班',
    };

    const updated: EvacueeRecord = {
      ...matchedRecord,
      aidDistributions: [...(matchedRecord.aidDistributions || []), newDist],
      updatedAt: new Date().toISOString(),
    };

    onUpdateRecord(updated);
    setMatchedRecord(updated);
    setSuccessNotice(`「${itemFull}」を ${matchedRecord.name} 様へ配布完了として記録しました。`);
    setCustomItem('');
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl mx-auto">
      <div className="mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-900">支援物資・食事 配布照合端末</h3>
          <p className="text-xs text-slate-500">
            避難者の受付証（QRコード・ID・区画番号）をスキャンして照合・配布を記録します
          </p>
        </div>
      </div>

      {/* スキャン/入力フォーム */}
      <form onSubmit={handleScan} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="受付ID、区画番号、またはQRリーダー入力..."
            value={scanQuery}
            onChange={e => setScanQuery(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
        >
          照合
        </button>
      </form>

      {successNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold">
          <span>{successNotice}</span>
        </div>
      )}

      {/* 照合結果 */}
      {matchedRecord && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                区画 No.{matchedRecord.slotNumber} ({matchedRecord.facilityId === 'aquadome' ? 'アクアドーム' : '競輪場'})
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">
                {matchedRecord.name} 様
              </h4>
              <span className="text-xs text-slate-500">
                同乗者含め計 <strong className="text-slate-800">{matchedRecord.passengerCount}名</strong> | 車両: {matchedRecord.vehicle.model} ({matchedRecord.vehicle.numberPlate})
              </span>
            </div>

            <div className="text-right">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                matchedRecord.healthStatus === 'bad' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                体調: {matchedRecord.healthStatus === 'bad' ? '不良(要対応)' : '良好/安定'}
              </span>
            </div>
          </div>

          {/* 希望ニーズ */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 block mb-1">事前要望ニーズ:</span>
            <div className="flex flex-wrap gap-1">
              {matchedRecord.aidNeeds.map(n => (
                <span key={n} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {n === 'water_food' ? '食料・水' : n === 'baby_supplies' ? '離乳食・オムツ' : n === 'blanket_warmth' ? '防寒具' : n}
                </span>
              ))}
            </div>
          </div>

          {/* 配布登録 */}
          <form onSubmit={handleDistribute} className="pt-3 border-t border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">配布品目</label>
                <select
                  value={selectedItem}
                  onChange={e => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="おにぎり・食料セット">おにぎり・非常食セット</option>
                  <option value="ミネラルウォーター 2L">ミネラルウォーター 2L</option>
                  <option value="毛布・アルミ防寒ブランケット">毛布・アルミ防寒ブランケット</option>
                  <option value="簡易トイレ・凝固剤セット">簡易トイレ・凝固剤セット</option>
                  <option value="紙おむつ・粉ミルクセット">紙おむつ・粉ミルクセット</option>
                  <option value="生理用品・衛生シート">生理用品・衛生シート</option>
                  <option value="その他">その他（以下に入力）</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">数量 (人分 / 個数)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
            </div>

            {selectedItem === 'その他' && (
              <div>
                <input
                  type="text"
                  placeholder="品目を手入力 (例: カセットコンロ用ガスボンベ)"
                  value={customItem}
                  onChange={e => setCustomItem(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              <span>受取完了を記録する</span>
            </button>
          </form>

          {/* 過去の受取歴 */}
          {matchedRecord.aidDistributions && matchedRecord.aidDistributions.length > 0 && (
            <div className="pt-2 text-xs text-slate-500">
              <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">受取済み履歴:</span>
              <div className="space-y-1">
                {matchedRecord.aidDistributions.map(d => (
                  <div key={d.id} className="flex justify-between bg-white p-1.5 rounded border border-slate-200">
                    <span>{d.item}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(d.distributedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

