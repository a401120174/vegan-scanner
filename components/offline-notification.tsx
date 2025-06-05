// 離線模式通知元件
import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateOnlineStatus(); // 初始檢查
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  
  if (!isOffline) return null;
  
  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-11/12 max-w-md bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2 text-amber-700">
        <WifiOff size={18} />
        <span className="font-medium">您目前處於離線狀態</span>
      </div>
      <p className="mt-1 text-xs text-amber-600">
        您可以繼續使用已載入的功能，但無法執行新的掃描和分析。
      </p>
    </div>
  );
}
