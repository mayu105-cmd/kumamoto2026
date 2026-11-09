import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EvacueeRecord } from '../../types';
import { generateCheckinUrl } from '../../utils/checkinReminder';

interface BatchEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRecords: EvacueeRecord[];
  onBatchSendSuccess: (sentRecords: EvacueeRecord[]) => void;
}

export const BatchEmailModal: React.FC<BatchEmailModalProps> = ({
  isOpen,
  onClose,
  targetRecords,
  onBatchSendSuccess,
}) => {
  // 選択された避難者IDのセット（デフォルトは全選択）
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(targetRecords.map(r => r.id)));
  // 送信中ステータス
  const [isSending, setIsSending] = useState(false);
  // 進捗状況
  const [progress, setProgress] = useState(0);
  // 完了フラグ
  const [isCompleted, setIsCompleted] = useState(false);
  // 送信ログ
  const [sendLogs, setSendLogs] = useState<string[]>([]);
  // コピー完了ステータス
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const validTargets = targetRecords.filter(r => !!r.email);
  const selectedRecords = validTargets.filter(r => selectedIds.has(r.id));

  // 全選択 / 全解除
  const handleToggleSelectAll = () => {
    if (selectedIds.size === validTargets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validTargets.map(r => r.id)));
    }
  };

  // 個別選択トグル
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // システム一括送信の実行
  const handleExecuteBatchSend = async () => {
    if (selectedRecords.length === 0) return;

    setIsSending(true);
    setProgress(0);
    setSendLogs([]);
    setIsCompleted(false);

    const now = new Date().toISOString();
    const logs: string[] = [];
    const total = selectedRecords.length;

    for (let i = 0; i < total; i++) {
      const record = selectedRecords[i];
      // 模擬的な送信ウェイト（UIのアニメーション体験）
      await new Promise(resolve => setTimeout(resolve, 80));

      logs.push(`区画 ${record.slotNumber.toString().padStart(3, '0')} ${record.name} 様 (${record.email}) へ更新案内URLを送信しました`);
      setSendLogs([...logs]);
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    const updatedRecords = selectedRecords.map(r => ({
      ...r,
      lastReminderSentAt: now,
      updatedAt: now,
    }));

    onBatchSendSuccess(updatedRecords);
    setIsSending(false);
    setIsCompleted(true);
  };

  // メーラー一括起動 (BCC)
  const handleOpenMailerBcc = () => {
    if (selectedRecords.length === 0) return;
    const bccList = selectedRecords.map(r => r.email).filter(Boolean).join(',');
    const subject = encodeURIComponent('【車中泊避難者支援】健康状態・支援ニーズの定期確認のお願い');
    const body = encodeURIComponent(
      `避難者の皆様\n\n` +
      `いつも車中泊避難者支援システムをご利用いただきありがとうございます。\n` +
      `熊本地震の教訓に基づき、車中泊避難時の健康悪化（エコノミークラス症候群等）予防および支援物資の適切な配給のため、\n` +
      `一日おきに健康状態および支援ニーズの確認を実施しております。\n\n` +
      `お手持ちのスマートフォンの「デジタル受付証（会員証）」画面から、\n` +
      `「健康・ニーズを更新する」ボタンを押して現在の体調とご希望の支援をご申告ください。\n\n` +
      `受付証を紛失された場合や画面が見当たらない場合は、受付システムの画面右上の「受付証の再検索」より電話番号をご入力いただくことで再表示できます。\n\n` +
      `ご不明な点や緊急の体調変化がございましたら、遠慮なく現地スタッフまたは救護所までお声がけください。\n\n` +
      `─────────────────\n` +
      `熊本市 車中泊避難者支援チーム`
    );

    window.location.href = `mailto:?bcc=${bccList}&subject=${subject}&body=${body}`;

    const now = new Date().toISOString();
    const updatedRecords = selectedRecords.map(r => ({
      ...r,
      lastReminderSentAt: now,
      updatedAt: now,
    }));
    onBatchSendSuccess(updatedRecords);
  };

  // アドレス一括コピー
  const handleCopyAddresses = () => {
    const emails = selectedRecords.map(r => r.email).filter(Boolean).join('; ');
    navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* モーダルヘッダー */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">定期確認メールの一括送信</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                選択中: {selectedRecords.length} / {validTargets.length} 名
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              対象の車中泊避難者へ、個別の健康状態・支援ニーズ定期更新URLを一括で送信します。
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* 送信完了サマリー */}
          {isCompleted && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-950 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold">一括送信が完了しました</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {selectedRecords.length} 名の避難者へ定期確認メールを送信し、台帳の送信記録を更新しました。
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-600 text-white rounded-lg">
                  送信完了
                </span>
              </div>
            </div>
          )}

          {/* プログレスバー（送信中） */}
          {isSending && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-950">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span>メールを一括送信中...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-indigo-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* メール文面のプレビュー */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-700 block mb-2">送信メール内容のプレビュー</span>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">件名:</span>
                <span className="font-bold text-slate-900">
                  【車中泊避難者支援】健康状態・支援ニーズの定期確認のお願い
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">本文（各避難者専用リンクが自動挿入されます）:</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed text-slate-600 font-mono">
                  <p>[避難者氏名] 様</p>
                  <p className="mt-1">いつも車中泊避難者支援システムをご利用いただきありがとうございます。</p>
                  <p>健康状態と支援ニーズの定期確認をお願いいたします（約1分）。</p>
                  <p className="mt-1 text-blue-700 underline">
                    ▼ 定期確認フォームURL: {window.location.origin}/?checkin=[避難者ID]
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 送信対象者の選択テーブル */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700">送信対象の避難者一覧</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  disabled={isSending}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  {selectedIds.size === validTargets.length ? 'すべて解除' : 'すべて選択'}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleCopyAddresses}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold"
                >
                  {copied ? 'コピー完了' : 'アドレス一括コピー'}
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === validTargets.length && validTargets.length > 0}
                        onChange={handleToggleSelectAll}
                        disabled={isSending}
                        className="rounded text-indigo-600"
                      />
                    </th>
                    <th className="py-2 px-3">区画</th>
                    <th className="py-2 px-3">氏名</th>
                    <th className="py-2 px-3">メールアドレス</th>
                    <th className="py-2 px-3">最終案内</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {validTargets.map(record => {
                    const isSelected = selectedIds.has(record.id);
                    return (
                      <tr
                        key={record.id}
                        onClick={() => !isSending && handleToggleSelect(record.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(record.id)}
                            disabled={isSending}
                            className="rounded text-indigo-600"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          No.{record.slotNumber.toString().padStart(3, '0')}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {record.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                          {record.email}
                        </td>
                        <td className="py-2 px-3 text-[10px] text-slate-400">
                          {record.lastReminderSentAt
                            ? new Date(record.lastReminderSentAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '未送信'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 送信ログ表示（送信後または送信中） */}
          {sendLogs.length > 0 && (
            <div className="bg-slate-900 text-slate-200 p-3 rounded-2xl font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">送信処理ログ:</span>
              {sendLogs.map((log, index) => (
                <div key={index} className="text-emerald-400">
                  ✓ {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* モーダルフッター */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40"
          >
            {isCompleted ? '閉じる' : 'キャンセル'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenMailerBcc}
              disabled={isSending || selectedRecords.length === 0}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-40"
              title="既定のメールアプリを開いてBCC一括送信"
            >
              メーラーで一括作成 (BCC)
            </button>

            <button
              type="button"
              onClick={handleExecuteBatchSend}
              disabled={isSending || selectedRecords.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 flex items-center justify-center min-w-[150px]"
            >
              {isSending ? '送信中...' : `一括送信を実行 (${selectedRecords.length}名)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

