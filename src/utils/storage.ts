import { EvacueeRecord, AdminUser } from '../types';
import { generateInitialMockData } from './mockData';
import { enqueueOfflineAction } from './offlineQueue';

const EVACUEES_STORAGE_KEY = 'kumamoto_evacuees_v1';
const AUTH_STORAGE_KEY = 'kumamoto_admin_auth_v1';
const MY_EVACUEE_ID_KEY = 'kumamoto_my_evacuee_id';

/**
 * 避難者台帳データの読み込み（なければ初期モックデータをセット）
 */
export function loadEvacueeRecords(): EvacueeRecord[] {
  try {
    const raw = localStorage.getItem(EVACUEES_STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialMockData();
      saveEvacueeRecords(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = generateInitialMockData();
      saveEvacueeRecords(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load evacuee records from storage:', err);
    return generateInitialMockData();
  }
}

/**
 * 避難者台帳データの保存
 */
export function saveEvacueeRecords(records: EvacueeRecord[]): void {
  try {
    localStorage.setItem(EVACUEES_STORAGE_KEY, JSON.stringify(records));
    // カスタムイベントを発火して同一ウィンドウ内のコンポーネントに通知
    window.dispatchEvent(new Event('evacuee-data-changed'));
  } catch (err) {
    console.error('Failed to save evacuee records to storage:', err);
  }
}

/**
 * 初期データへのリセット
 */
export function resetToInitialMockData(): EvacueeRecord[] {
  const fresh = generateInitialMockData();
  saveEvacueeRecords(fresh);
  return fresh;
}

/**
 * 避難者レコードの新規追加
 * オフライン時はキューに積んでローカル保存も行う
 */
export function addEvacueeRecord(record: EvacueeRecord): void {
  if (!navigator.onLine) {
    enqueueOfflineAction({ type: 'add', payload: record });
  }
  const records = loadEvacueeRecords();
  // 既存の同じ施設・区画があれば上書きまたは置き換え
  const filtered = records.filter(r => !(r.facilityId === record.facilityId && r.slotNumber === record.slotNumber));
  filtered.push(record);
  saveEvacueeRecords(filtered);
}

/**
 * 避難者レコードの更新
 * オフライン時はキューに積んでローカル保存も行う
 */
export function updateEvacueeRecord(updatedRecord: EvacueeRecord): void {
  if (!navigator.onLine) {
    enqueueOfflineAction({ type: 'update', payload: updatedRecord });
  }
  const records = loadEvacueeRecords();
  const index = records.findIndex(r => r.id === updatedRecord.id);
  if (index !== -1) {
    records[index] = { ...updatedRecord, updatedAt: new Date().toISOString() };
    saveEvacueeRecords(records);
  }
}

/**
 * 避難者レコードの削除（退去・チェックアウト）
 * オフライン時はキューに積んでローカル保存も行う
 */
export function deleteEvacueeRecord(id: string): void {
  if (!navigator.onLine) {
    enqueueOfflineAction({ type: 'delete', payload: id });
  }
  const records = loadEvacueeRecords();
  const filtered = records.filter(r => r.id !== id);
  saveEvacueeRecords(filtered);
}

/**
 * 直近登録した避難者のID（避難者ブラウザ用）
 */
export function getSavedMyEvacueeId(): string | null {
  try {
    return localStorage.getItem(MY_EVACUEE_ID_KEY);
  } catch {
    return null;
  }
}

export function setSavedMyEvacueeId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(MY_EVACUEE_ID_KEY, id);
    } else {
      localStorage.removeItem(MY_EVACUEE_ID_KEY);
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * 管理者ログインセッション
 */
export function getSavedAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSavedAdminUser(user: AdminUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    window.dispatchEvent(new Event('admin-auth-changed'));
  } catch (err) {
    console.error(err);
  }
}

