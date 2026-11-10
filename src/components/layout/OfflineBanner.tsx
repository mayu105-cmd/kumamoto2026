import { useEffect, useState, useCallback } from 'react';
import { flushOfflineQueue, getOfflineQueueLength, OfflineAction } from '../../utils/offlineQueue';

interface OfflineBannerProps {
  onFlushQueue: (actions: OfflineAction[]) => void;
}

type BannerState = 'hidden' | 'offline' | 'syncing' | 'synced';

export default function OfflineBanner({ onFlushQueue }: OfflineBannerProps) {
  const [state, setState] = useState<BannerState>(
    navigator.onLine ? 'hidden' : 'offline'
  );
  const [pendingCount, setPendingCount] = useState(0);

  const handleOnline = useCallback(() => {
    const count = getOfflineQueueLength();
    if (count > 0) {
      setState('syncing');
      setPendingCount(count);
      flushOfflineQueue((actions) => {
        onFlushQueue(actions);
      });
      setTimeout(() => setState('synced'), 800);
      setTimeout(() => setState('hidden'), 3500);
    } else {
      setState('synced');
      setTimeout(() => setState('hidden'), 3000);
    }
  }, [onFlushQueue]);

  const handleOffline = useCallback(() => {
    setState('offline');
    setPendingCount(getOfflineQueueLength());
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  if (state === 'hidden') return null;

  if (state === 'offline') {
    return (
      <div className="bg-amber-500 text-white text-sm px-4 py-2 flex items-center gap-2 justify-center shadow-md z-50">
        <span className="inline-block w-2 h-2 rounded-full bg-white opacity-80 animate-pulse" />
        <span>
          オフライン状態です。登録・更新した情報は端末に保存され、接続が回復すると自動的に反映されます。
          {pendingCount > 0 && (
            <span className="ml-2 font-semibold">（未同期: {pendingCount}件）</span>
          )}
        </span>
      </div>
    );
  }

  if (state === 'syncing') {
    return (
      <div className="bg-blue-600 text-white text-sm px-4 py-2 flex items-center gap-2 justify-center shadow-md z-50">
        <span className="inline-block w-2 h-2 rounded-full bg-white opacity-80 animate-ping" />
        <span>接続が回復しました。オフライン中の操作（{pendingCount}件）を反映しています...</span>
      </div>
    );
  }

  // synced
  return (
    <div className="bg-green-600 text-white text-sm px-4 py-2 flex items-center gap-2 justify-center shadow-md z-50">
      <span>✓ データの同期が完了しました。</span>
    </div>
  );
}

