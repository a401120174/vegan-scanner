// PWA 功能測試
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

export function PWAFeatureTest() {
  const [pwaFeatures, setPWAFeatures] = useState({
    serviceWorker: false,
    webManifest: false,
    cacheStorage: false,
    isInstalled: false,
    isOnline: true
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // 檢查 PWA 功能
    const checkPWAFeatures = async () => {
      // 檢查 Service Worker
      const hasSW = 'serviceWorker' in navigator;
      
      // 檢查 Web Manifest
      const manifestLinks = document.querySelectorAll('link[rel="manifest"]');
      const hasManifest = manifestLinks.length > 0;
      
      // 檢查安裝狀態
      const isInStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      // 檢查 Cache Storage API
      const hasCache = 'caches' in window;
      
      // 檢查網絡狀態
      const isOnline = navigator.onLine;
      
      setPWAFeatures({
        serviceWorker: hasSW,
        webManifest: hasManifest,
        cacheStorage: hasCache,
        isInstalled: isInStandaloneMode,
        isOnline
      });
    };
    
    checkPWAFeatures();
    
    // 監聽網絡狀態變化
    const handleOnlineStatusChange = () => {
      setPWAFeatures(prev => ({...prev, isOnline: navigator.onLine}));
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  if (!showDetails) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDetails(true)}
        className="text-xs mt-4"
      >
        檢查 PWA 功能
      </Button>
    );
  }

  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-lg border text-sm w-full">
      <div className="flex justify-between">
        <h3 className="font-medium">PWA 功能狀態</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDetails(false)}
          className="h-6 w-6 p-0"
        >
          ✕
        </Button>
      </div>
      
      <div className="mt-2 space-y-1">
        <div className="flex justify-between">
          <span>Service Worker:</span>
          <span className={pwaFeatures.serviceWorker ? "text-green-600" : "text-red-600"}>
            {pwaFeatures.serviceWorker ? "✓ 支援" : "✗ 不支援"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Web Manifest:</span>
          <span className={pwaFeatures.webManifest ? "text-green-600" : "text-red-600"}>
            {pwaFeatures.webManifest ? "✓ 已設置" : "✗ 未設置"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>離線緩存:</span>
          <span className={pwaFeatures.cacheStorage ? "text-green-600" : "text-red-600"}>
            {pwaFeatures.cacheStorage ? "✓ 支援" : "✗ 不支援"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>安裝狀態:</span>
          <span className={pwaFeatures.isInstalled ? "text-green-600" : "text-blue-600"}>
            {pwaFeatures.isInstalled ? "✓ 已安裝" : "待安裝"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>網絡狀態:</span>
          <span className={pwaFeatures.isOnline ? "text-green-600" : "text-red-600"}>
            {pwaFeatures.isOnline ? "✓ 在線" : "✗ 離線"}
          </span>
        </div>
      </div>
      
      {pwaFeatures.isInstalled && (
        <p className="mt-3 text-xs text-green-600">
          應用已成功安裝為 PWA！
        </p>
      )}
      
      {!pwaFeatures.isInstalled && (
        <p className="mt-3 text-xs text-blue-600">
          點擊瀏覽器選單中的"安裝"或"添加到主屏幕"來安裝此應用。
        </p>
      )}
    </div>
  );
}
