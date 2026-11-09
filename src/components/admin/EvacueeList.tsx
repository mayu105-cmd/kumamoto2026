import React, { useState } from 'react';
import { EvacueeRecord, FacilityId, HealthStatus } from '../../types';
import { FACILITIES, HEALTH_STATUS_LABELS } from '../../utils/constants';
import { evaluateEvacueeRisk, isPatrolNeeded } from '../../utils/riskAssessment';
import { exportToCsvWithBom, exportToJsonBackup } from '../../utils/csv';

interface EvacueeListProps {
  records: EvacueeRecord[];
  selectedFacility: FacilityId;
  onSelectSlot: (slot: number) => void;
  onEditRecord: (record: EvacueeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onTogglePatrol: (id: string) => void;
  onOpenNewRegister: () => void;
  initialFilter?: string;
}

export const EvacueeList: React.FC<EvacueeListProps> = ({
  records,
  selectedFacility,
  onSelectSlot,
  onEditRecord,
  onDeleteRecord,
  onTogglePatrol,
  onOpenNewRegister,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<string>(selectedFacility);
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>(initialFilter);
  const [patrolFilter, setPatrolFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'slot' | 'entryTime' | 'risk'>('slot');
  const [sortAsc, setSortAsc] = useState(true);

  // フィルタリング
  const filtered = records.filter(record => {
    const risk = evaluateEvacueeRisk(record);

    // 施設
    if (facilityFilter !== 'all' && record.facilityId !== facilityFilter) return false;

    // 体調
    if (healthFilter !== 'all' && record.healthStatus !== healthFilter) return false;

    // 巡回（健康が注意・警戒の人のみ対象）
    const needsPatrol = isPatrolNeeded(record);
    if (patrolFilter === 'pending' && (!needsPatrol || record.patrolStatus === 'patrolled')) return false;
    if (patrolFilter === 'patrolled' && (!needsPatrol || record.patrolStatus !== 'patrolled')) return false;

    // リスク
    if (riskFilter === 'risk_critical' && risk.riskLevel !== 'critical') return false;
    if (riskFilter === 'risk_high' && (risk.riskLevel !== 'high' && risk.riskLevel !== 'critical')) return false;
    if (riskFilter === 'over24h' && !risk.isOver24h) return false;
    if (riskFilter === 'economy' && !risk.economyClassSyndromeWarning) return false;
    if (riskFilter === 'care' && record.specialNeeds.length === 0) return false;

    // 検索語
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = record.name.toLowerCase().includes(q) || (record.nameKana && record.nameKana.toLowerCase().includes(q));
      const matchPhone = record.phone.replace(/-/g, '').includes(q.replace(/-/g, ''));
      const matchId = record.id.toLowerCase().includes(q);
      const matchPlate = record.vehicle.numberPlate.toLowerCase().includes(q);
      const matchModel = record.vehicle.model.toLowerCase().includes(q);
      const matchEmail = record.email ? record.email.toLowerCase().includes(q) : false;
      const matchSlot = record.slotNumber.toString() === q;
      if (!matchName && !matchPhone && !matchId && !matchPlate && !matchModel && !matchSlot && !matchEmail) {
        return false;
      }
    }

    return true;
  });

  // ソート
  filtered.sort((a, b) => {
    const riskA = evaluateEvacueeRisk(a);
    const riskB = evaluateEvacueeRisk(b);

    if (sortField === 'slot') {
      return sortAsc ? a.slotNumber - b.slotNumber : b.slotNumber - a.slotNumber;
    }
    if (sortField === 'entryTime') {
      const timeA = new Date(a.entryTime).getTime();
      const timeB = new Date(b.entryTime).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    }
    if (sortField === 'risk') {
      const riskWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return sortAsc
        ? riskWeight[riskB.riskLevel] - riskWeight[riskA.riskLevel]
        : riskWeight[riskA.riskLevel] - riskWeight[riskB.riskLevel];
    }
    return 0;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`「${name}」様の避難者台帳データを退去として削除しますか？`)) {
      onDeleteRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 画面ヘッダー */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>車中泊避難者 台帳管理システム</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              全 {records.length} 件 登録済
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            健康リスクの早期発見、支援ニーズ集計、巡回見回りステータスの管理、CSV出力・編集に対応。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToCsvWithBom(records)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            title="Excelで開けるUTF-8 BOM付きCSVをダウンロード"
          >
            <span>CSV出力 (BOM付)</span>
          </button>

          <button
            onClick={onOpenNewRegister}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <span>避難者を新規受付</span>
          </button>
        </div>
      </div>

      {/* 検索 & フィルターバー */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* 検索入力 */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="氏名、電話番号、車番、区画番号、避難IDでリアルタイム検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* 施設フィルター */}
          <select
            value={facilityFilter}
            onChange={e => setFacilityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">全施設 (アクアドーム & 競輪場)</option>
            <option value="aquadome">アクアドームくまもと</option>
            <option value="keirin">熊本競輪場</option>
          </select>

          {/* リスク・警戒フィルター */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
          >
            <option value="all">全リスク区分</option>
            <option value="risk_critical">即時救護 (Criticalのみ)</option>
            <option value="risk_high">高リスク (High & Critical)</option>
            <option value="economy">エコノミークラス症候群警戒</option>
            <option value="over24h">滞在24時間超のみ</option>
            <option value="care">要配慮者（乳幼児・妊産婦等）</option>
          </select>

          {/* 体調ステータス */}
          <select
            value={healthFilter}
            onChange={e => setHealthFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">体調: すべて</option>
            <option value="bad">体調不良のみ</option>
            <option value="caution">要注意のみ</option>
            <option value="good">良好のみ</option>
          </select>

          {/* 巡回ステータス */}
          <select
            value={patrolFilter}
            onChange={e => setPatrolFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">巡回: すべて</option>
            <option value="pending">要巡回のみ (注意・警戒)</option>
            <option value="patrolled">見回り完了のみ</option>
          </select>
        </div>

        {/* ヒット件数 */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
          <span>該当件数: <strong className="text-slate-800 font-mono text-sm">{filtered.length}</strong> 件</span>
          <div className="flex items-center gap-2">
            <span>並び替え:</span>
            <button
              onClick={() => {
                if (sortField === 'slot') setSortAsc(!sortAsc);
                else { setSortField('slot'); setSortAsc(true); }
              }}
              className={`px-2 py-0.5 rounded text-xs font-bold border ${sortField === 'slot' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200'}`}
            >
              区画番号 {sortField === 'slot' && (sortAsc ? '▲' : '▼')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'risk') setSortAsc(!sortAsc);
                else { setSortField('risk'); setSortAsc(true); }
              }}
              className={`px-2 py-0.5 rounded text-xs font-bold border ${sortField === 'risk' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200'}`}
            >
              リスク順 {sortField === 'risk' && (sortAsc ? '▲' : '▼')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'entryTime') setSortAsc(!sortAsc);
                else { setSortField('entryTime'); setSortAsc(false); }
              }}
              className={`px-2 py-0.5 rounded text-xs font-bold border ${sortField === 'entryTime' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200'}`}
            >
              滞在時間順 {sortField === 'entryTime' && (sortAsc ? '▲' : '▼')}
            </button>
          </div>
        </div>
      </div>

      {/* 台帳テーブル */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">区画 / 施設</th>
                <th className="py-3 px-4">代表者氏名 (連絡先)</th>
                <th className="py-3 px-4">車両情報</th>
                <th className="py-3 px-4">人数</th>
                <th className="py-3 px-4">体調・健康警戒</th>
                <th className="py-3 px-4">滞在時間</th>
                <th className="py-3 px-4">支援ニーズ</th>
                <th className="py-3 px-4">見回り巡回</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    条件に該当する避難者データが見つかりませんでした。
                  </td>
                </tr>
              ) : (
                filtered.map(record => {
                  const risk = evaluateEvacueeRisk(record);
                  const isCritical = risk.riskLevel === 'critical';
                  const isHigh = risk.riskLevel === 'high';

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isCritical ? 'bg-red-50/40' : isHigh ? 'bg-amber-50/30' : ''
                        }`}
                    >
                      {/* 区画 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectSlot(record.slotNumber)}
                            className="font-mono font-black text-sm bg-slate-900 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors"
                            title="駐車マップで確認"
                          >
                            No.{record.slotNumber.toString().padStart(3, '0')}
                          </button>
                          <span className="text-[11px] text-slate-500 block">
                            {record.facilityId === 'aquadome' ? 'アクアドーム' : '競輪場'}
                          </span>
                        </div>
                      </td>

                      {/* 氏名・電話 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{record.name}</span>
                          <span className="text-[11px] font-normal text-slate-400">({record.ageGroup})</span>
                        </div>
                        <div className="font-mono text-slate-500 text-[11px]">{record.phone}</div>
                        {record.email && (
                          <div className="font-mono text-[10px] text-blue-600 truncate max-w-[140px]" title={record.email}>
                            {record.email}
                          </div>
                        )}
                      </td>

                      {/* 車両 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{record.vehicle.model}</div>
                        <div className="font-mono text-[11px] text-slate-500">{record.vehicle.numberPlate}</div>
                      </td>

                      {/* 人数 */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                        {record.passengerCount} 名
                      </td>

                      {/* 体調・リスク */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${record.healthStatus === 'bad'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : record.healthStatus === 'caution'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                            {HEALTH_STATUS_LABELS[record.healthStatus].label}
                          </span>

                          {risk.economyClassSyndromeWarning && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
                              血栓警戒
                            </span>
                          )}
                        </div>

                        {risk.reasons.length > 0 && (
                          <div className="text-[10px] text-red-700 mt-1 max-w-xs truncate" title={risk.reasons.join(', ')}>
                            {risk.reasons[0]}
                          </div>
                        )}
                      </td>

                      {/* 滞在時間 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">
                          {risk.hoursStaying.toFixed(0)} 時間
                        </div>
                        {risk.isOver24h && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                            24h超
                          </span>
                        )}
                      </td>

                      {/* ニーズ */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {record.aidNeeds.slice(0, 2).map(n => (
                            <span key={n} className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                              {n === 'water_food' ? '水食料' : n === 'blanket_warmth' ? '防寒具' : n === 'baby_supplies' ? '乳児品' : n === 'medical_consult' ? '医療' : n}
                            </span>
                          ))}
                          {record.aidNeeds.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{record.aidNeeds.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* 見回り巡回 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPatrolNeeded(record) ? (
                          <button
                            onClick={() => onTogglePatrol(record.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${record.patrolStatus === 'patrolled'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 animate-pulse'
                              }`}
                          >
                            <span>{record.patrolStatus === 'patrolled' ? '見回り済' : '要巡回 (未完了)'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                            対象外 (良好)
                          </span>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditRecord(record)}
                            className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                            title="詳細編集"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(record.id, record.name)}
                            className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                            title="退去（削除）"
                          >
                            退去
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

