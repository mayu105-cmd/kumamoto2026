import React, { useState } from 'react';
import { EvacueeRecord, FacilityId } from '../../types';
import { FACILITIES, AID_NEEDS_OPTIONS } from '../../utils/constants';
import { evaluateEvacueeRisk, isPatrolNeeded } from '../../utils/riskAssessment';
import { needsCheckinReminder, generateMailtoLink, generateCheckinUrl, hoursSinceLastCheckin } from '../../utils/checkinReminder';
import { BatchEmailModal } from './BatchEmailModal';

interface DashboardProps {
  records: EvacueeRecord[];
  selectedFacility: FacilityId;
  onSelectSlot: (slot: number) => void;
  onNavigateToParking: () => void;
  onNavigateToList: (filter?: string) => void;
  onQuickPatrol: (id: string) => void;
  onUpdateRecord?: (updated: EvacueeRecord) => void;
  onBatchUpdateRecords?: (records: EvacueeRecord[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  selectedFacility,
  onSelectSlot,
  onNavigateToParking,
  onNavigateToList,
  onQuickPatrol,
  onUpdateRecord,
  onBatchUpdateRecords,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reminderFilter, setReminderFilter] = useState<'all' | 'needs_send'>('needs_send');
  const [isBatchEmailOpen, setIsBatchEmailOpen] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);
  // 現在選択中の施設のレコード
  const facilityRecords = records.filter(r => r.facilityId === selectedFacility);
  const totalCapacity = FACILITIES[selectedFacility].totalCapacity; // 150
  const occupiedCount = facilityRecords.length;
  const occupancyRate = ((occupiedCount / totalCapacity) * 100).toFixed(1);

  // 全施設合算のサマリー
  const allOccupied = records.length;
  const allTotalCapacity = 300; // 150 + 150
  const allTotalPeople = records.reduce((acc, cur) => acc + (cur.passengerCount || 1), 0);

  // リスク評価計算
  const evaluatedRecords = facilityRecords.map(r => ({
    record: r,
    risk: evaluateEvacueeRisk(r),
  }));

  // 統計集計
  const criticalCount = evaluatedRecords.filter(e => e.risk.riskLevel === 'critical').length;
  const highRiskCount = evaluatedRecords.filter(e => e.risk.riskLevel === 'high').length;
  const over24hCount = evaluatedRecords.filter(e => e.risk.isOver24h).length;
  const economyWarningCount = evaluatedRecords.filter(e => e.risk.economyClassSyndromeWarning).length;
  const totalPatrolNeededCount = evaluatedRecords.filter(e => isPatrolNeeded(e.record)).length;
  const pendingPatrolCount = evaluatedRecords.filter(e => isPatrolNeeded(e.record) && e.record.patrolStatus !== 'patrolled').length;

  // 要確認リスト（健康が注意・警戒で巡回が必要な避難者）
  const urgentCheckList = evaluatedRecords
    .filter(e => isPatrolNeeded(e.record) && (e.record.patrolStatus !== 'patrolled' || e.risk.requiresImmediateCheck))
    .sort((a, b) => (b.risk.hoursStaying - a.risk.hoursStaying));

  // 支援ニーズ集計
  const aidNeedsCount: Record<string, { label: string; count: number; icon: string }> = {};
  AID_NEEDS_OPTIONS.forEach(opt => {
    aidNeedsCount[opt.id] = { label: opt.label, count: 0, icon: opt.icon };
  });

  facilityRecords.forEach(r => {
    r.aidNeeds.forEach(need => {
      if (aidNeedsCount[need]) {
        aidNeedsCount[need].count += (r.passengerCount || 1); // 同乗者も含めた人数分を反映
      }
    });
  });

  // 要配慮者数の集計
  const specialNeedsSummary = {
    infant: facilityRecords.filter(r => r.specialNeeds.includes('infant')).length,
    pregnant: facilityRecords.filter(r => r.specialNeeds.includes('pregnant')).length,
    elderly: facilityRecords.filter(r => r.specialNeeds.includes('elderly')).length,
    chronic: facilityRecords.filter(r => r.specialNeeds.includes('chronic_disease')).length,
    pet: facilityRecords.filter(r => r.specialNeeds.includes('pet')).length,
  };

  // 一日おき定期確認・メールリマインダー集計
  const emailRegisteredRecords = facilityRecords.filter(r => !!r.email);
  const reminderNeededRecords = facilityRecords.filter(r => needsCheckinReminder(r));
  const displayedReminderRecords = reminderFilter === 'needs_send'
    ? reminderNeededRecords
    : emailRegisteredRecords;

  const handleSendReminder = (record: EvacueeRecord) => {
    const mailto = generateMailtoLink(record);
    if (!mailto) return;
    window.location.href = mailto;
    if (onUpdateRecord) {
      onUpdateRecord({
        ...record,
        lastReminderSentAt: new Date().toISOString(),
      });
    }
  };

  const handleCopyUrl = (record: EvacueeRecord) => {
    const url = generateCheckinUrl(record);
    navigator.clipboard.writeText(url);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBatchSendSuccess = (sentRecords: EvacueeRecord[]) => {
    if (onBatchUpdateRecords) {
      onBatchUpdateRecords(sentRecords);
    } else if (onUpdateRecord) {
      sentRecords.forEach(r => onUpdateRecord(r));
    }
    setBatchSuccessMessage(`${sentRecords.length} 名へ定期確認メールを一括送信しました。`);
    setTimeout(() => setBatchSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 熊本地震教訓：エコノミークラス症候群警戒トップアラート */}
      {(economyWarningCount > 0 || criticalCount > 0) && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl">
                【緊急警戒】エコノミークラス症候群・健康悪化アラート
              </span>
              <span className="px-2 py-0.5 rounded bg-white text-red-700 font-black text-xs">
                {criticalCount}名 要即時救護
              </span>
            </div>
            <p className="text-xs sm:text-sm text-red-100 mt-1">
              足のむくみ・ふくらはぎの痛みや呼吸困難を訴える避難者が検知されました。熊本地震での災害関連死防止のため、現地医療班（DMAT・保健師）は直ちに指定区画を巡回してください。
            </p>
          </div>
          <button
            onClick={() => onNavigateToList('risk_critical')}
            className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl shadow-md transition-colors shrink-0"
          >
            <span>警戒対象者を確認</span>
          </button>
        </div>
      )}

      {/* KPIカードグリッド */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 駐車収容状況 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-500">駐車車両 / 収容容量</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{occupiedCount}</span>
            <span className="text-xs text-slate-400 font-bold">/ {totalCapacity} 台</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  Number(occupancyRate) > 85 ? 'bg-red-500' : Number(occupancyRate) > 60 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, Number(occupancyRate))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>収容率: {occupancyRate}%</span>
              <span>空き: {totalCapacity - occupiedCount} 区画</span>
            </div>
          </div>
        </div>

        {/* 総避難者数 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-500">滞在避難者数 (総計)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {facilityRecords.reduce((acc, c) => acc + (c.passengerCount || 1), 0)}
            </span>
            <span className="text-xs text-slate-500 font-bold">名 (同乗者含む)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            2施設合計: {allTotalPeople}名 ({allOccupied}台 滞在中)
          </p>
        </div>

        {/* 滞在24時間超 (エコノミークラス警戒) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-500">連続車中泊 24h超過</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 font-mono">{over24hCount}</span>
            <span className="text-xs text-slate-500 font-bold">台 (要声かけ)</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-3">
            長時間同一姿勢による血栓形成リスク大
          </p>
        </div>

        {/* 要即時見回り・未巡回 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-500">健康注意・警戒 見回り対象</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">
              {pendingPatrolCount}
            </span>
            <span className="text-xs text-slate-500 font-bold">件 (未巡回)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            注意・警戒対象: 計 {totalPatrolNeededCount} 台
          </p>
        </div>

        {/* 一日おき定期確認 要メール案内 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-500">一日おき定期確認</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${reminderNeededRecords.length > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
              {reminderNeededRecords.length}
            </span>
            <span className="text-xs text-slate-500 font-bold">件 (要案内)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            メール登録: {emailRegisteredRecords.length} 件 / 24h未更新
          </p>
        </div>
      </div>

      {/* 要配慮者のクイックステータスバー */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700">
          当施設内の要配慮者数:
        </span>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
            乳幼児: <strong className="text-blue-700">{specialNeedsSummary.infant}世帯</strong>
          </span>
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
            妊産婦: <strong className="text-rose-700">{specialNeedsSummary.pregnant}名</strong>
          </span>
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
            高齢者: <strong className="text-amber-700">{specialNeedsSummary.elderly}世帯</strong>
          </span>
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
            基礎疾患: <strong className="text-red-700">{specialNeedsSummary.chronic}名</strong>
          </span>
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
            ペット同伴: <strong className="text-slate-700">{specialNeedsSummary.pet}台</strong>
          </span>
        </div>
      </div>

      {/* メイン2カラムレイアウト: 要確認リスト & 支援物資需要集計 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側: 緊急見回り・要確認避難者リスト */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">健康リスク警戒・要見回りリスト</h3>
              <p className="text-xs text-slate-500">体調不良・滞在24h超・特記事項から自動判定</p>
            </div>
            <button
              onClick={onNavigateToParking}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              <span>駐車マップで見る</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {urgentCheckList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                現在、要即時確認の避難者はいません。<br />順調に見回り・救護が行われています。
              </div>
            ) : (
              urgentCheckList.map(({ record, risk }) => (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border transition-all ${
                    risk.riskLevel === 'critical'
                      ? 'border-red-300 bg-red-50/60'
                      : 'border-amber-200 bg-amber-50/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm bg-slate-900 text-white px-2 py-0.5 rounded">
                        区画 {record.slotNumber.toString().padStart(3, '0')}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{record.name} 様</span>
                      <span className="text-xs text-slate-500">({record.ageGroup})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                        risk.riskLevel === 'critical'
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {risk.riskLevel === 'critical' ? '即時救護' : '重点巡回'}
                      </span>
                    </div>
                  </div>

                  {/* アラート要因 */}
                  <div className="space-y-1 mb-3">
                    {risk.reasons.map((r, i) => (
                      <div key={i} className="text-xs text-red-700 font-medium">
                        <span>・{r}</span>
                      </div>
                    ))}
                    {record.healthNote && (
                      <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200 mt-1">
                        申告メモ: {record.healthNote}
                      </p>
                    )}
                  </div>

                  {/* 車両情報とアクションボタン */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-mono">
                      {record.vehicle.model} ({record.vehicle.numberPlate}) / 滞在: {risk.hoursStaying.toFixed(0)}h
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectSlot(record.slotNumber)}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                      >
                        詳細確認
                      </button>
                      <button
                        onClick={() => onQuickPatrol(record.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                      >
                        <span>見回り完了</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右側: 支援物資需要集計・配布準備アシスタント */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">支援物資ニーズ集計</h3>
              <p className="text-xs text-slate-500">物資調達・配布準備の目安（同乗者換算）</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              リアルタイム集計
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {Object.entries(aidNeedsCount).map(([key, data]) => {
              const count = data.count;
              const ratio = Math.min(100, Math.round((count / (facilityRecords.reduce((a, c) => a + c.passengerCount, 0) || 1)) * 100));

              return (
                <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-800">
                      <span>{data.label}</span>
                    </span>
                    <span className="font-mono font-black text-sm text-blue-800">
                      {count} <span className="text-xs font-normal text-slate-500">人分</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>必要割合</span>
                    <span>約 {ratio}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <h5 className="text-xs font-bold text-blue-900 mb-1">物資班ワンポイント</h5>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              粉ミルクやオムツ、防寒具は夜間に急激に需要が高まります。配給時は避難者のデジタル受付証QRをスキャンして受取確認を行ってください。
            </p>
          </div>
        </div>
      </div>

      {/* 一日おき定期確認・健康＆ニーズ更新案内（メール送信管理）パネル */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">一日おき定期確認・更新案内メール送信管理</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                reminderNeededRecords.length > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {reminderNeededRecords.length > 0 ? `${reminderNeededRecords.length}件 要更新案内` : '全件更新完了'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              避難者の体調悪化（エコノミークラス症候群等）や物資不足を早期把握するため、一日おきに更新用URLをメール案内します。
            </p>
          </div>

          {/* フィルター＆一括操作 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setReminderFilter('needs_send')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reminderFilter === 'needs_send'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                要案内 ({reminderNeededRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setReminderFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reminderFilter === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                登録全件 ({emailRegisteredRecords.length})
              </button>
            </div>

            {/* 一括送信ボタン */}
            <button
              type="button"
              onClick={() => setIsBatchEmailOpen(true)}
              disabled={emailRegisteredRecords.length === 0}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center disabled:opacity-40"
              title="選択した避難者へ定期確認メールを一括送信"
            >
              メール一括送信 ({reminderNeededRecords.length > 0 ? `${reminderNeededRecords.length}件` : '登録全件'})
            </button>
          </div>
        </div>

        {/* 一括送信成功アラート */}
        {batchSuccessMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex justify-between items-center animate-fade-in">
            <span>{batchSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setBatchSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-normal underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* 避難者リスト */}
        <div className="mt-4">
          {displayedReminderRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {reminderFilter === 'needs_send'
                ? '現在、一日おき更新案内が必要な避難者はいません（全件直近24時間以内に更新済み、またはメール未登録）。'
                : 'メールアドレスが登録されている避難者はいません。'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {displayedReminderRecords.map(record => {
                const hoursSince = hoursSinceLastCheckin(record);
                const isOverdue = hoursSince >= 24;

                return (
                  <div
                    key={record.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      isOverdue
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          区画 {record.slotNumber.toString().padStart(3, '0')}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {record.name} 様
                        </span>
                        <span className="text-xs text-slate-500">
                          ({record.ageGroup} / {record.vehicle.model})
                        </span>
                        {isOverdue ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            未更新: 約{hoursSince.toFixed(0)}時間経過
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            更新済: 約{hoursSince.toFixed(0)}時間前
                          </span>
                        )}
                        {record.lastReminderSentAt && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            案内送信済: {new Date(record.lastReminderSentAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                        <span>メール: <strong className="font-mono text-slate-800">{record.email}</strong></span>
                        <span>電話: <span className="font-mono text-slate-700">{record.phone}</span></span>
                        <span>
                          {record.lastDailyCheckinAt
                            ? `最終確認日時: ${new Date(record.lastDailyCheckinAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                            : `入庫日時: ${new Date(record.entryTime).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(record)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
                        title="定期確認フォームURLをコピー"
                      >
                        {copiedId === record.id ? 'URLコピー完了' : '確認URLコピー'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendReminder(record)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center"
                        title="既定のメールアプリを開いて更新案内メールを作成"
                      >
                        メール作成 (送信)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 一括メール送信モーダル */}
      <BatchEmailModal
        isOpen={isBatchEmailOpen}
        onClose={() => setIsBatchEmailOpen(false)}
        targetRecords={reminderNeededRecords.length > 0 ? reminderNeededRecords : emailRegisteredRecords}
        onBatchSendSuccess={handleBatchSendSuccess}
      />
    </div>
  );
};

