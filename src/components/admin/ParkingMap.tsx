import React, { useState } from 'react';
import { EvacueeRecord, FacilityId } from '../../types';
import { FACILITIES } from '../../utils/constants';
import { evaluateEvacueeRisk, isPatrolNeeded } from '../../utils/riskAssessment';

interface ParkingMapProps {
  records: EvacueeRecord[];
  selectedFacility: FacilityId;
  onSelectFacility: (f: FacilityId) => void;
  onSlotClick: (slotNumber: number, record?: EvacueeRecord) => void;
  onOpenNewRegisterForSlot: (slotNumber: number) => void;
}

export const ParkingMap: React.FC<ParkingMapProps> = ({
  records,
  selectedFacility,
  onSelectFacility,
  onSlotClick,
  onOpenNewRegisterForSlot,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bad' | 'care' | 'over24h' | 'pending' | 'vacant'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const facility = FACILITIES[selectedFacility];
  const totalSlots = facility.totalCapacity; // 150

  // 当該施設のレコードをマップ化 (slotNumber -> record)
  const slotMap = new Map<number, EvacueeRecord>();
  records
    .filter(r => r.facilityId === selectedFacility)
    .forEach(r => slotMap.set(r.slotNumber, r));

  // 1〜150の区画配列 (全ブロック)
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const slotNumber = i + 1;
    const record = slotMap.get(slotNumber);
    const risk = record ? evaluateEvacueeRisk(record) : null;

    // ステータス分類
    let status: 'vacant' | 'good' | 'care' | 'bad' = 'vacant';
    if (record) {
      if (risk?.riskLevel === 'critical' || record.healthStatus === 'bad' || risk?.economyClassSyndromeWarning) {
        status = 'bad';
      } else if (
        risk?.riskLevel === 'high' ||
        record.healthStatus === 'caution' ||
        risk?.isOver24h ||
        record.specialNeeds.length > 0
      ) {
        status = 'care';
      } else {
        status = 'good';
      }
    }

    return {
      slotNumber,
      record,
      risk,
      status,
    };
  });

  // 統計
  const vacantCount = slots.filter(s => s.status === 'vacant').length;
  const goodCount = slots.filter(s => s.status === 'good').length;
  const careCount = slots.filter(s => s.status === 'care').length;
  const badCount = slots.filter(s => s.status === 'bad').length;
  const over24hCount = slots.filter(s => s.risk?.isOver24h).length;

  // フィルタリング（全ブロック対象）
  const filteredSlots = slots.filter(slot => {
    // 検索クエリ
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchSlot = slot.slotNumber.toString().includes(q);
      const matchName = slot.record?.name.toLowerCase().includes(q);
      const matchPlate = slot.record?.vehicle.numberPlate.toLowerCase().includes(q);
      const matchModel = slot.record?.vehicle.model.toLowerCase().includes(q);
      if (!matchSlot && !matchName && !matchPlate && !matchModel) return false;
    }

    // カテゴリフィルター
    if (filterType === 'vacant') return slot.status === 'vacant';
    if (filterType === 'bad') return slot.status === 'bad';
    if (filterType === 'care') return slot.status === 'care';
    if (filterType === 'over24h') return !!slot.risk?.isOver24h;
    if (filterType === 'pending') return !!(slot.record && isPatrolNeeded(slot.record) && slot.record.patrolStatus !== 'patrolled');

    return true;
  });

  return (
    <div className="space-y-6">
      {/* 施設ヘッダー & 切替 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              リアルタイム駐車管理マップ
            </span>
            <span className="text-xs text-slate-500 font-mono">150台 収容キャパシティ</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            <span>{facility.name} 駐車区画マップ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            所在地: {facility.address} | 各区画をクリックすると避難者カルテ・健康状態の確認・見回り記録が行えます。
          </p>
        </div>

        {/* 施設切替タブ */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          {(['aquadome', 'keirin'] as FacilityId[]).map(fid => (
            <button
              key={fid}
              onClick={() => onSelectFacility(fid)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedFacility === fid
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {FACILITIES[fid].name} (150台)
            </button>
          ))}
        </div>
      </div>

      {/* 色分け凡例 & 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 空き */}
        <div
          onClick={() => setFilterType(filterType === 'vacant' ? 'all' : 'vacant')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'vacant' ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              <span className="text-xs font-bold text-slate-700">空き区画</span>
            </div>
            <span className="font-mono text-xl font-black text-emerald-700">{vacantCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">新規受け入れ可能</div>
        </div>

        {/* 駐車中（良好） */}
        <div
          onClick={() => setFilterType('all')}
          className="p-3.5 rounded-2xl border bg-white border-slate-200 hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
              <span className="text-xs font-bold text-slate-700">駐車中・安定</span>
            </div>
            <span className="font-mono text-xl font-black text-blue-700">{goodCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">体調良好・一般</div>
        </div>

        {/* 要配慮・要注意 */}
        <div
          onClick={() => setFilterType(filterType === 'care' ? 'all' : 'care')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'care' ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              <span className="text-xs font-bold text-slate-700">要配慮・注意</span>
            </div>
            <span className="font-mono text-xl font-black text-amber-700">{careCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">高齢・妊産婦・乳幼児・24h</div>
        </div>

        {/* 体調不良・要警戒 */}
        <div
          onClick={() => setFilterType(filterType === 'bad' ? 'all' : 'bad')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'bad' ? 'ring-2 ring-red-500 bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-red-100 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">体調不良・高リスク</span>
            </div>
            <span className="font-mono text-xl font-black text-red-600">{badCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">足のむくみ・息苦しさ・発熱</div>
        </div>
      </div>

      {/* 検索・絞り込みフィルターツールバー */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
            全ブロック
          </span>

          {/* ステータスフィルター */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: '全区画' },
              { id: 'bad', label: '体調不良のみ' },
              { id: 'care', label: '要配慮のみ' },
              { id: 'over24h', label: '24h超のみ' },
              { id: 'pending', label: '要巡回のみ (注意・警戒)' },
              { id: 'vacant', label: '空き区画のみ' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  filterType === f.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 検索ボックス */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="氏名・車番・区画番号で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 駐車マップ（150区画グリッド描画） */}
      <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 text-white">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              PARKING LOT LAYOUT (1〜150 SLOTS)
            </span>
          </div>
          <span className="text-xs text-slate-400">
            表示中: {filteredSlots.length} / 150 区画
          </span>
        </div>

        {/* グリッドレイアウト: 10列 x 15行 = 150区画 */}
        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-15 gap-2">
          {slots.map(slot => {
            const isMatch = filteredSlots.some(f => f.slotNumber === slot.slotNumber);
            const { slotNumber, record, risk, status } = slot;

            // 色クラス
            let colorClasses = '';
            if (status === 'bad') {
              colorClasses = 'bg-red-600/90 text-white border-red-400 shadow-md shadow-red-900/50 hover:bg-red-500 animate-pulse ring-2 ring-red-400';
            } else if (status === 'care') {
              colorClasses = 'bg-amber-500/90 text-slate-900 border-amber-300 shadow-md shadow-amber-900/30 hover:bg-amber-400 font-bold';
            } else if (status === 'good') {
              colorClasses = 'bg-blue-600/80 text-white border-blue-400/50 hover:bg-blue-500';
            } else {
              colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-700/80 hover:text-slate-200 hover:border-emerald-500';
            }

            return (
              <button
                key={slotNumber}
                disabled={!isMatch}
                onClick={() => {
                  if (record) {
                    onSlotClick(slotNumber, record);
                  } else {
                    onOpenNewRegisterForSlot(slotNumber);
                  }
                }}
                className={`relative p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all h-20 ${colorClasses} ${
                  !isMatch ? 'opacity-15 grayscale pointer-events-none' : 'hover:scale-105 active:scale-95'
                }`}
                title={
                  record
                    ? `区画 ${slotNumber}: ${record.name}様 (${record.vehicle.model}) - ${record.healthStatus === 'bad' ? '体調不良' : record.healthStatus === 'caution' ? '要注意' : '良好'}`
                    : `区画 ${slotNumber}: 空き（クリックで新規受付）`
                }
              >
                {/* 区画番号と巡回ステータス（健康注意・警戒の人のみ表示） */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-black tracking-tight">
                    {slotNumber.toString().padStart(3, '0')}
                  </span>
                  {record && isPatrolNeeded(record) && (
                    record.patrolStatus === 'patrolled' ? (
                      <span className="text-[9px] font-bold px-1 rounded bg-emerald-500 text-white" title="見回り完了済">
                        済
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-1 rounded bg-rose-600 text-white animate-pulse" title="健康注意/警戒：要巡回">
                        巡
                      </span>
                    )
                  )}
                </div>

                {/* ステータス略称 */}
                <div className="my-auto">
                  {status === 'bad' ? (
                    <span className="text-xs font-black text-white">警戒</span>
                  ) : status === 'care' ? (
                    <span className="text-xs font-black text-slate-900">注意</span>
                  ) : status === 'good' ? (
                    <span className="text-xs font-black text-blue-200">駐車</span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">空き</span>
                  )}
                </div>

                {/* 避難者氏名または車番略称 */}
                <div className="w-full truncate text-[9px] font-medium leading-none">
                  {record ? record.name.split(' ')[0] : '受付可'}
                </div>
              </button>
            );
          })}
        </div>

        {/* マップ下部ナビゲーション */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-600" /> 体調不良 (即時救護)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" /> 要配慮/24h超
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" /> 駐車中(安定)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" /> 空き区画
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-black px-1 rounded bg-rose-600 text-white">巡</span> 要巡回 (注意・警戒のみ)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1 rounded bg-emerald-500 text-white">済</span> 巡回済
            </span>
          </div>
          <span>※空き区画をクリックすると、代理での避難者登録が可能です。</span>
        </div>
      </div>
    </div>
  );
};

