import { EvacueeRecord } from '../types';

export type OfflineActionType = 'add' | 'update' | 'delete';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: EvacueeRecord | string; // string for delete (record id)
  timestamp: number;
}

const QUEUE_KEY = 'kumamoto_offline_queue';

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): void {
  const queue = getOfflineQueue();
  const entry: OfflineAction = {
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Returns the number of pending offline actions.
 */
export function getOfflineQueueLength(): number {
  return getOfflineQueue().length;
}

/**
 * Flushes the queue by calling the provided callback with all pending actions,
 * then clears the queue.
 */
export function flushOfflineQueue(
  onFlush: (actions: OfflineAction[]) => void
): void {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  onFlush(queue);
  clearOfflineQueue();
}

