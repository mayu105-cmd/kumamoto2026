import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { EvacueeRecord } from '../../types';
import { FACILITIES, HEALTH_STATUS_LABELS } from '../../utils/constants';
import { evaluateEvacueeRisk } from '../../utils/riskAssessment';
import { hoursSinceLastCheckin } from '../../utils/checkinReminder';

interface DigitalPassProps {
  record: EvacueeRecord;
  onOpenHealthUpdate: () => void;
  onOpenDailyCheckin?: () => void;
  onReissueSearch: () => void;
}

export const DigitalPass: React.FC<DigitalPassProps> = ({
  record,
  onOpenHealthUpdate,
  onOpenDailyCheckin,
  onReissueSearch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const risk = evaluateEvacueeRisk(record);
  const facility = FACILITIES[record.facilityId];
  const hoursSinceCheckin = hoursSinceLastCheckin(record);
  const isCheckinOverdue = hoursSinceCheckin >= 24;

  // QRコード描画
  useEffect(() => {
    if (!canvasRef.current) return;
    const qrPayload = JSON.stringify({
      id: record.id,
      name: record.name,
      facility: record.facilityId,
      slot: record.slotNumber,
      phone: record.phone,
      v: record.vehicle.numberPlate
    });

    QRCode.toCanvas(
      canvasRef.current,
      qrPayload,
      {
        width: 180,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      },
      (err) => {
        if (err) console.error('Failed to render QR Code:', err);
      }
    );
  }, [record]);

  // 印刷
  const handlePrint = () => {
    window.print();
  };

  // IDコピー
  const handleCopyId = () => {
    navigator.clipboard.writeText(record.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* 画面上部のアナウンス */}
      <div className="mb-4 bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between no-print shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-emerald-950">車中泊避難者 登録完了</h3>
          <p className="text-xs text-emerald-700">
            この画面は物資受け取り時に提示してください。
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
        >
          <span>印刷</span>
        </button>
      </div>

      {/* 一日おき定期確認（健康状態・支援ニーズの更新）バナー */}
      {onOpenDailyCheckin && (
        <div className={`mb-4 p-4 rounded-2xl border no-print shadow-sm transition-all ${
          isCheckinOverdue
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isCheckinOverdue ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {isCheckinOverdue ? '定期更新のお願い' : '一日おき定期確認'}
                </span>
                <h4 className="text-sm font-bold">
                  {isCheckinOverdue ? '前回の更新から24時間以上経過しています' : '健康状態・支援ニーズの定期確認'}
                </h4>
              </div>
              <p className="text-xs mt-1 text-slate-600">
                {record.lastDailyCheckinAt
                  ? `最終更新: ${new Date(record.lastDailyCheckinAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : '初回登録以降、まだ定期確認が行われていません'}
              </p>
            </div>
            <button
              onClick={onOpenDailyCheckin}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-colors shrink-0 text-white ${
                isCheckinOverdue
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              健康・ニーズを更新する
            </button>
          </div>
        </div>
      )}

      {/* 会員証カード本体 */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden relative">
        {/* カードヘッダー */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] tracking-widest font-bold uppercase bg-blue-500/40 px-2 py-0.5 rounded">
                Kumamoto Disaster Evacuee Pass
              </span>
              <h2 className="text-xl font-black mt-1">車中泊避難 受付証（デジタル会員証）</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-blue-200 block">避難者受付番号</span>
              <button
                onClick={handleCopyId}
                className="font-mono text-sm font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors text-white"
                title="クリックでIDをコピー"
              >
                {record.id}
              </button>
              {copied && <span className="text-[10px] text-emerald-300 block">コピー完了</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-100">
            <span className="font-bold text-white">{facility.name}</span>
            <span>|</span>
            <span>入庫: {new Date(record.entryTime).toLocaleDateString('ja-JP')} {new Date(record.entryTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* 駐車区画番号ハイライト（巨大表示） */}
        <div className="bg-blue-50/70 border-b border-blue-100 p-4 text-center">
          <span className="text-xs font-bold text-blue-800 block mb-0.5">指定駐車区画番号</span>
          <div className="text-4xl font-black font-mono tracking-tight text-blue-900">
            区画 No. {record.slotNumber.toString().padStart(3, '0')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            ※移動時は速やかにスタッフまでお申し出ください。
          </span>
        </div>

        {/* カードメインコンテンツ */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-between pb-6 border-b border-slate-100">
            {/* QRコード表示 */}
            <div className="flex flex-col items-center">
              <div className="p-2 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl shadow-inner">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1.5">
                物資配布時にこのQRコードを提示
              </span>
            </div>

            {/* 避難者・車両基本情報 */}
            <div className="flex-1 w-full space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">代表者氏名</span>
                <div className="text-lg font-bold text-slate-900 flex items-center justify-between">
                  <span>{record.name} <span className="text-xs font-normal text-slate-500">様</span></span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {record.ageGroup}
                  </span>
                </div>
                {record.nameKana && <div className="text-xs text-slate-400">{record.nameKana}</div>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">車両ナンバー</span>
                  <span className="font-mono font-bold text-slate-800">{record.vehicle.numberPlate}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{record.vehicle.model} ({record.vehicle.color})</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">同乗者数 (計)</span>
                  <span className="text-base font-bold text-blue-800">{record.passengerCount} 名</span>
                  <span className="text-[10px] text-slate-500 block">
                    {record.passengers.length > 0 ? `同乗 ${record.passengers.length}名` : '単身'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">緊急連絡先:</span>
                <span className="font-mono font-bold text-slate-800">{record.phone}</span>
              </div>
            </div>
          </div>

          {/* 現在の体調・健康ステータス */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-700">
                健康状態・エコノミークラス警戒
              </h4>
              <button
                onClick={onOpenHealthUpdate}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold px-2 py-1 bg-blue-50 rounded-lg border border-blue-200 transition-colors no-print"
              >
                <span>体調の再申告・更新</span>
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              record.healthStatus === 'bad'
                ? 'bg-red-50 border-red-300 text-red-900'
                : record.healthStatus === 'caution'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  申告体調: {HEALTH_STATUS_LABELS[record.healthStatus].label}
                </span>
                <span className="text-xs opacity-75">
                  滞在: 約{risk.hoursStaying.toFixed(0)}時間経過
                  {risk.isOver24h && ' (24h超警戒)'}
                </span>
              </div>

              {risk.reasons.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                  {risk.reasons.map((r, i) => (
                    <div key={i} className="text-[11px]">
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 支援ニーズの確認 */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-700 mb-1.5">
              登録中の支援希望
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {record.aidNeeds.length === 0 ? (
                <span className="text-xs text-slate-400">特になし</span>
              ) : (
                record.aidNeeds.map(need => (
                  <span
                    key={need}
                    className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-medium"
                  >
                    {need === 'water_food' && '飲料水・食料'}
                    {need === 'blanket_warmth' && '毛布・防寒具'}
                    {need === 'portable_toilet' && '簡易トイレ'}
                    {need === 'medical_consult' && '医療・常備薬'}
                    {need === 'baby_supplies' && '粉ミルク・おむつ'}
                    {need === 'sanitary' && '衛生用品'}
                    {need === 'power_gasoline' && '充電・ガソリン'}
                    {need === 'other' && 'その他要望'}
                  </span>
                ))
              )}
            </div>
            {record.aidNeedsNote && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-200">
                メモ: {record.aidNeedsNote}
              </p>
            )}
          </div>

          {/* 物資受取履歴 */}
          {record.aidDistributions && record.aidDistributions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                受取済み支援物資
              </h4>
              <div className="space-y-1.5">
                {record.aidDistributions.map(dist => (
                  <div key={dist.id} className="text-xs bg-emerald-50/50 border border-emerald-200 p-2 rounded-lg flex justify-between items-center text-emerald-950">
                    <span className="font-medium">{dist.item}</span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      {new Date(dist.distributedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (担当: {dist.staffName})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* カードフッター */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-600">
            画面を閉じた場合も、右上の<strong>「受付証の再検索」</strong>から電話番号を入力して再表示できます。
          </p>
        </div>
      </div>

      {/* エコノミークラス症候群予防のワンポイント */}
      <div className="mt-6 bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 no-print shadow-sm">
        <h4 className="text-xs font-bold text-amber-900 mb-2">
          【命を守るために】車中泊を続けられる方へ
        </h4>
        <div className="text-xs space-y-1 text-amber-900/90 leading-relaxed">
          <p>• 定期的に車外へ出て背伸びやふくらはぎを揉みほぐしてください。</p>
          <p>• トイレを我慢せず、こまめに水分を摂取してください。</p>
          <p>• 足のむくみや痛み、息苦しさを感じたら、ためらわずにスタッフまたは救護所へお申し出ください。</p>
        </div>
      </div>
    </div>
  );
};
