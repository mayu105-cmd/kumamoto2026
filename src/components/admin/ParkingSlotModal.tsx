import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EvacueeRecord, AdminUser } from '../../types';
import { FACILITIES } from '../../utils/constants';
import { evaluateEvacueeRisk, isPatrolNeeded } from '../../utils/riskAssessment';
import { generateMailtoLink, hoursSinceLastCheckin } from '../../utils/checkinReminder';

interface ParkingSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EvacueeRecord | null;
  adminUser: AdminUser | null;
  onUpdateRecord: (updated: EvacueeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenEditModal: (record: EvacueeRecord) => void;
}

export const ParkingSlotModal: React.FC<ParkingSlotModalProps> = ({
  isOpen,
  onClose,
  record,
  adminUser,
  onUpdateRecord,
  onDeleteRecord,
  onOpenEditModal,
}) => {
  const [distributeItemName, setDistributeItemName] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);

  if (!isOpen || !record) return null;

  const risk = evaluateEvacueeRisk(record);
  const facility = FACILITIES[record.facilityId];

  // 見回り完了記録
  const handleTogglePatrol = () => {
    const isNowPatrolled = record.patrolStatus !== 'patrolled';
    const updated: EvacueeRecord = {
      ...record,
      patrolStatus: isNowPatrolled ? 'patrolled' : 'pending',
      lastPatrolledAt: isNowPatrolled ? new Date().toISOString() : undefined,
      lastPatrolledBy: isNowPatrolled ? (adminUser?.name || '巡回スタッフ') : undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord(updated);
  };

  // 物資配布追加
  const handleAddDistribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributeItemName.trim()) return;

    const newDist = {
      id: 'dist-' + Date.now(),
      item: distributeItemName.trim(),
      distributedAt: new Date().toISOString(),
      staffName: adminUser?.name || '支援スタッフ',
    };

    const updated: EvacueeRecord = {
      ...record,
      aidDistributions: [...(record.aidDistributions || []), newDist],
      updatedAt: new Date().toISOString(),
    };

    onUpdateRecord(updated);
    setDistributeItemName('');
    setIsDistributing(false);
  };

  // 退去・チェックアウト
  const handleDelete = () => {
    if (window.confirm(`区画 No.${record.slotNumber} の ${record.name} 様の避難者データを退去（チェックアウト）として削除しますか？`)) {
      onDeleteRecord(record.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* モーダルヘッダー */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl font-mono text-xl font-black">
              No.{record.slotNumber.toString().padStart(3, '0')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {facility.name}
                </span>
                <span className="font-mono text-xs text-slate-400">{record.id}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {record.name} 様 <span className="text-sm font-normal text-slate-500">({record.ageGroup})</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* リスク警告アラート */}
        {risk.reasons.length > 0 && (
          <div className={`mt-4 p-3.5 rounded-2xl border ${
            risk.riskLevel === 'critical'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="font-bold text-xs mb-1">
              <span>自動健康リスク警戒判定: {risk.riskLevel.toUpperCase()}</span>
            </div>
            <ul className="text-xs space-y-0.5 ml-6 list-disc">
              {risk.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 基本情報グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">車両情報</span>
            <div className="font-bold text-slate-800 text-sm">{record.vehicle.model} ({record.vehicle.color})</div>
            <div className="font-mono text-xs text-blue-700 font-bold mt-0.5">{record.vehicle.numberPlate}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              同乗者数: 代表者含め <strong className="text-slate-800">{record.passengerCount} 名</strong>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">滞在・見回り状況</span>
            <div className="text-xs text-slate-700 flex items-center justify-between">
              <span>滞在時間:</span>
              <span className="font-mono font-bold text-slate-900">
                約 {risk.hoursStaying.toFixed(1)} 時間 ({risk.isOver24h ? '24h超' : '24h未満'})
              </span>
            </div>
            <div className="text-xs text-slate-700 flex items-center justify-between mt-1">
              <span>入庫日時:</span>
              <span className="font-mono text-slate-500">
                {new Date(record.entryTime).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-xs text-slate-700 flex items-center justify-between mt-1">
              <span>巡回状態:</span>
              {isPatrolNeeded(record) ? (
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  record.patrolStatus === 'patrolled'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {record.patrolStatus === 'patrolled' ? '見回り完了' : '要巡回 (未巡回)'}
                </span>
              ) : (
                <span className="font-medium text-slate-400 text-[11px] px-2 py-0.5 rounded bg-slate-100">
                  巡回対象外 (良好)
                </span>
              )}
            </div>
            {record.lastPatrolledBy && (
              <div className="text-[10px] text-slate-400 mt-1 text-right">
                最終巡回: {record.lastPatrolledBy} ({new Date(record.lastPatrolledAt!).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })})
              </div>
            )}
          </div>
        </div>

        {/* 連絡先 & 一日おき定期確認状況 */}
        <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">連絡先 & 一日おき定期確認状況</span>
            {record.email && (
              <button
                type="button"
                onClick={() => {
                  const mailto = generateMailtoLink(record);
                  if (mailto) {
                    window.location.href = mailto;
                    onUpdateRecord({
                      ...record,
                      lastReminderSentAt: new Date().toISOString(),
                    });
                  }
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                定期確認メール作成
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">電話番号:</span> <strong className="font-mono text-slate-800">{record.phone}</strong>
            </div>
            <div>
              <span className="text-slate-500">メール:</span> <strong className="font-mono text-slate-800">{record.email || '未登録'}</strong>
            </div>
            <div>
              <span className="text-slate-500">最終定期確認:</span>{' '}
              <span className="text-slate-700">
                {record.lastDailyCheckinAt
                  ? `${new Date(record.lastDailyCheckinAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (約${hoursSinceLastCheckin(record).toFixed(0)}時間前)`
                  : '未確認'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">案内メール送信:</span>{' '}
              <span className="text-slate-700">
                {record.lastReminderSentAt
                  ? new Date(record.lastReminderSentAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '未送信'}
              </span>
            </div>
          </div>
        </div>

        {/* 同乗者一覧 */}
        {record.passengers.length > 0 && (
          <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">同乗者名簿 ({record.passengers.length}名)</span>
            <div className="space-y-1.5">
              {record.passengers.map(p => (
                <div key={p.id} className="text-xs bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">{p.name} 様</span>
                  <span className="text-slate-500">{p.relation} ({p.ageGroup})</span>
                  {p.notes && <span className="text-slate-400 text-[11px]">{p.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 支援ニーズ & 配布記録 */}
        <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-700">希望支援物資</span>
            <button
              onClick={() => setIsDistributing(!isDistributing)}
              className="text-xs text-blue-700 font-bold hover:underline"
            >
              + 物資配布を記録
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {record.aidNeeds.map(need => (
              <span key={need} className="text-xs bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded-md">
                {need}
              </span>
            ))}
          </div>

          {record.aidNeedsNote && (
            <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mb-2">
              要望メモ: {record.aidNeedsNote}
            </p>
          )}

          {/* 配布入力フォーム */}
          {isDistributing && (
            <form onSubmit={handleAddDistribution} className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
              <input
                type="text"
                placeholder="配布品目 (例: 水2L x 2, 毛布1枚)"
                value={distributeItemName}
                onChange={e => setDistributeItemName(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                配布完了を記録
              </button>
            </form>
          )}

          {/* 配布履歴 */}
          {record.aidDistributions && record.aidDistributions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">配布済履歴:</span>
              {record.aidDistributions.map(d => (
                <div key={d.id} className="text-xs text-slate-600 flex justify-between">
                  <span>• {d.item}</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(d.distributedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} ({d.staffName})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッターアクションバー */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isPatrolNeeded(record) && (
              <button
                onClick={handleTogglePatrol}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm ${
                  record.patrolStatus === 'patrolled'
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <span>{record.patrolStatus === 'patrolled' ? '見回りを未完了に戻す' : '見回りを完了にする'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenEditModal(record);
                onClose();
              }}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <span>情報編集</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
              title="避難者が退去した場合のデータ削除"
            >
              <span>退去・チェックアウト</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

