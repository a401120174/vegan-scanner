// 素食掃描儀 PWA 初始化腳本
document.addEventListener('DOMContentLoaded', () => {
  initializeServiceWorker();
  generatePWAIcons();
  setupAppInstallEvents();
  registerPeriodicSync();
});

// 初始化 Service Worker
function initializeServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker 註冊成功:', registration.scope);
          
          // 檢查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有可用更新，通知用戶
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error('Service Worker 註冊失敗:', error);
        });
      
      // 檢查是否已經安裝
      window.addEventListener('appinstalled', (event) => {
        console.log('素食掃描儀已安裝到設備上');
        // 記錄安裝事件
        localStorage.setItem('pwa-installed', 'true');
      });
    });
  }
}

// 動態產生 PWA 圖標
function generatePWAIcons() {
  // 需要產生的圖標尺寸
  const sizes = [192, 384, 512];
  const iconCanvas = document.createElement('canvas');
  const ctx = iconCanvas.getContext('2d');

  sizes.forEach(size => {
    iconCanvas.width = size;
    iconCanvas.height = size;
    
    // 繪製背景
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, size, size);
    
    // 繪製文字
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 大文字 - "素食"
    const mainFontSize = size * 0.2; // 圖標尺寸的 20%
    ctx.font = `bold ${mainFontSize}px Arial, "PingFang TC", "Microsoft JhengHei", sans-serif`;
    ctx.fillText('素食', size/2, size/2 - mainFontSize/2);
    
    // 小文字 - "掃描儀"
    const subFontSize = size * 0.12; // 圖標尺寸的 12%
    ctx.font = `bold ${subFontSize}px Arial, "PingFang TC", "Microsoft JhengHei", sans-serif`;
    ctx.fillText('掃描儀', size/2, size/2 + mainFontSize/2);
    
    // 將圖標轉換為 Blob
    try {
      iconCanvas.toBlob((blob) => {
        if (blob) {
          // 創建一個可以在本地存儲的圖標 URL
          const iconUrl = URL.createObjectURL(blob);
          
          // 如果需要，可以在本地存儲中保存這個 URL 以供後續使用
          localStorage.setItem(`pwa-icon-${size}`, iconUrl);
          
          // 動態創建一個 link 元素添加到 head
          const link = document.createElement('link');
          link.rel = 'icon';
          link.sizes = `${size}x${size}`;
          link.href = iconUrl;
          document.head.appendChild(link);
          
          // 如果是 192x192 尺寸的圖標，也設置為 Apple Touch Icon
          if (size === 192) {
            const appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.href = iconUrl;
            document.head.appendChild(appleLink);
          }
        }
      }, 'image/png', 0.9);
    } catch (e) {
      console.error('無法創建圖標:', e);
    }
  });
}

// 設置應用安裝事件
function setupAppInstallEvents() {
  let deferredPrompt;
  
  // 監聽 beforeinstallprompt 事件，以便稍後觸發
  window.addEventListener('beforeinstallprompt', (e) => {
    // 防止 Chrome 67 及更早版本自動顯示安裝提示
    e.preventDefault();
    // 儲存事件以便稍後觸發
    deferredPrompt = e;
    // 可以在這裡讓自定義的安裝按鈕變成可見
    console.log('可以安裝 PWA');
  });
  
  // 檢測是否已經作為 PWA 運行
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    console.log('以 PWA 模式運行');
  }
}

// 註冊週期性同步 (如果支援)
function registerPeriodicSync() {
  if ('serviceWorker' in navigator && 'periodicSync' in navigator) {
    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        // 確認瀏覽器支援 periodicSync API
        if ('periodicSync' in registration) {
          const periodicSyncManager = registration.periodicSync;
          // 檢查權限
          const permission = await navigator.permissions.query({
            name: 'periodic-background-sync',
          });
          
          if (permission.state === 'granted') {
            // 註冊背景同步任務
            await periodicSyncManager.register('content-sync', {
              minInterval: 24 * 60 * 60 * 1000, // 每 24 小時同步一次
            });
            console.log('已註冊週期性背景同步');
          }
        }
      } catch (error) {
        console.log('週期性背景同步不支援或註冊失敗:', error);
      }
    });
  }
}

// 顯示更新通知
function showUpdateNotification() {
  if (document.getElementById('update-notification')) return;
  
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.className = 'fixed bottom-4 left-0 right-0 mx-auto w-11/12 max-w-md bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-50 animate-fade-in';
  notification.style.cssText = 'animation: fadeIn 0.5s; z-index: 9999;';
  
  notification.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2 text-blue-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <span class="font-medium">新版本可用</span>
      </div>
      <button id="update-close" class="text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <p class="mt-1 text-sm text-blue-600">
      已有新版本的素食掃描儀可用，請重新整理頁面以更新。
    </p>
    <div class="mt-2 flex justify-end">
      <button id="update-now" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
        立即更新
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 添加事件監聽器
  document.getElementById('update-close').addEventListener('click', () => {
    notification.remove();
  });
  
  document.getElementById('update-now').addEventListener('click', () => {
    window.location.reload();
  });
  
  // 添加一個簡單的淡入動畫
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease forwards;
    }
  `;
  document.head.appendChild(style);
}
