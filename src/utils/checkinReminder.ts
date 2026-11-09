import { EvacueeRecord } from '../types';

const REMINDER_INTERVAL_HOURS = 24; // 一日おき

/**
 * リマインダーが必要かどうか判定する
 * lastDailyCheckinAt が未設定、または最終確認から24h以上経過している場合 true
 */
export function needsCheckinReminder(record: EvacueeRecord): boolean {
  if (!record.email) return false; // メールなし → 対象外
  const reference = record.lastDailyCheckinAt || record.entryTime;
  const diff = Date.now() - new Date(reference).getTime();
  return diff >= REMINDER_INTERVAL_HOURS * 3600 * 1000;
}

/**
 * 定期確認用URL生成
 * ?checkin=<evacueeId> を付与したURLを返す
 */
export function generateCheckinUrl(record: EvacueeRecord): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?checkin=${encodeURIComponent(record.id)}`;
}

/**
 * リマインダーメールのmailto:リンクを生成する
 */
export function generateMailtoLink(record: EvacueeRecord): string {
  if (!record.email) return '';
  const url = generateCheckinUrl(record);
  const subject = encodeURIComponent('【車中泊避難者支援】健康状態・支援ニーズの定期確認のお願い');
  const body = encodeURIComponent(
    `${record.name} 様\n\n` +
    `いつも車中泊避難者支援システムをご利用いただきありがとうございます。\n\n` +
    `健康状態と支援ニーズの定期確認をお願いいたします。\n` +
    `以下のリンクから約1分で入力できます。\n\n` +
    `▼ 定期確認フォーム\n` +
    `${url}\n\n` +
    `ご不明な点は担当スタッフにお声がけください。\n` +
    `引き続きどうぞよろしくお願いいたします。\n\n` +
    `─────────────────\n` +
    `熊本市 車中泊避難者支援チーム`
  );
  return `mailto:${record.email}?subject=${subject}&body=${body}`;
}

/**
 * 最終確認からの経過時間（時間単位）を返す
 */
export function hoursSinceLastCheckin(record: EvacueeRecord): number {
  const reference = record.lastDailyCheckinAt || record.entryTime;
  return (Date.now() - new Date(reference).getTime()) / (3600 * 1000);
}

