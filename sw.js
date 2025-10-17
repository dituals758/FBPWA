// Service Worker для Flappy Bird PWA
const CACHE_NAME = 'flappy-bird-v1.1.2';
const STATIC_CACHE = 'static-v1.1.2';
const DYNAMIC_CACHE = 'dynamic-v1.1.2';

// Критические ресурсы
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker: Установка начата');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        console.log('📦 Service Worker: Кеширование критических ресурсов');
        await cache.addAll(STATIC_ASSETS);
        console.log('✅ Service Worker: Установка завершена');
        return self.skipWaiting();
      } catch (error) {
        console.error('❌ Service Worker: Ошибка установки', error);
        throw error;
      }
    })()
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker: Активация');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Удаление старого кеша', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        console.log('✅ Service Worker: Активация завершена');
        return self.clients.claim();
      } catch (error) {
        console.error('❌ Service Worker: Ошибка активации', error);
      }
    })()
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем не-GET запросы и chrome-extension
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') ||
      event.request.url.includes('sockjs-node')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Пытаемся получить из кеша
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Загружаем из сети
        const networkResponse = await fetch(event.request);
        
        // Клонируем ответ для кеширования
        const responseToCache = networkResponse.clone();
        
        if (networkResponse.status === 200) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(event.request, responseToCache).catch(err => {
            console.warn('⚠️ Не удалось закешировать:', event.request.url, err);
          });
        }
        
        return networkResponse;
      } catch (error) {
        console.error('❌ Fetch failed:', error);
        
        // Фолбэк для HTML-страниц
        if (event.request.destination === 'document') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
        
        // Возвращаем ошибку для API запросов
        return new Response('Оффлайн режим', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Здесь можно реализовать фоновую синхронизацию данных
  console.log('Выполняется фоновая синхронизация');
}

// Push уведомления
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление от Flappy Bird!',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'play',
        title: '🎮 Играть'
      },
      {
        action: 'close',
        title: '❌ Закрыть'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Flappy Bird', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'play') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Ничего не делаем, просто закрываем
  } else {
    // Обычный клик по уведомлению
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: '3.0',
      cache: CACHE_NAME
    });
  }
});