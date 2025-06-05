// 素食掃描儀 Service Worker
const CACHE_NAME = 'vegan-scanner-v1';

// 需要緩存的資源列表
const RESOURCES_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/banner.png',
  '/icons/base-icon.svg',
  '/pwa-init.js'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: 安裝中');
  
  // 將網站核心資源加入快取
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 快取核心資源中');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: 所有資源已快取');
        return self.skipWaiting(); // 強制新的 SW 立即生效
      })
  );
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 已啟用');
  
  // 清除舊版本快取
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('Service Worker: 正在刪除舊的快取', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service Worker: 現在控制所有頁面');
      return self.clients.claim(); // 控制所有頁面
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  // 跳過非 GET 請求
  if (event.request.method !== 'GET') return;
  
  // 跳過瀏覽器擴展請求
  if (!(event.request.url.indexOf('http') === 0)) return;
  
  // 實作網路優先策略
  // 對於 API 等動態資源，先嘗試網路請求，若失敗則使用緩存
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 對於一般資源，採用緩存優先策略
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果有緩存就直接返回
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 否則發出網路請求
        return fetch(event.request)
          .then((response) => {
            // 檢查回應是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆回應，因為回應是一個 stream，只能使用一次
            const responseToCache = response.clone();
            
            // 將新的回應加入緩存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch((error) => {
            console.error('Service Worker: 取得資源失敗', error);
            // 如果這是一個頁面請求，可以返回離線頁面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            return new Response('網路連線失敗，無法取得資源', { 
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 處理推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: data.url
    })
  );
});

// 處理通知點擊事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
