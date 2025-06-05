// PWA 安裝提示元件
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // 監聽 beforeinstallprompt 事件
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // 防止 Chrome 67 及更早版本自動顯示安裝提示
      e.preventDefault();
      // 保存事件以便稍後觸發
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // 顯示我們自己的提示
      setShowPrompt(true);
    };

    // 檢查使用者是否已經安裝了 PWA
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (!isAppInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 觸發安裝流程
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // 顯示安裝提示
    await installPrompt.prompt();
    
    // 等待使用者回應提示
    const { outcome } = await installPrompt.userChoice;
    
    // 無論結果如何，清除儲存的提示
    setInstallPrompt(null);
    setShowPrompt(false);
  };

  // 關閉提示
  const handleDismiss = () => {
    setShowPrompt(false);
    // 可以設置一個本地儲存標記，防止頻繁提示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-11/12 max-w-md bg-white border border-primary/20 rounded-lg p-4 shadow-lg z-50">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg text-primary">安裝素食掃描儀</h3>
          <p className="text-sm text-muted-foreground mt-1">
            添加到主屏幕，隨時查看是否為素食！
          </p>
        </div>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="mt-3 flex gap-2">
        <Button 
          onClick={handleInstallClick}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          安裝應用
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDismiss}
          className="flex-1"
        >
          暫時不要
        </Button>
      </div>
    </div>
  );
}
