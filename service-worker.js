// Service Worker لدعم وضع عدم الاتصال بالإنترنت
const CACHE_NAME = 'todo-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Tajawal:wght@400;700&display=swap'
];

// تثبيت Service Worker وتخزين الملفات في الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم فتح الكاش');
        return cache.addAll(urlsToCache);
      })
  );
});

// استراتيجية الشبكة أولاً ثم الكاش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // نسخ الاستجابة لأننا سنستخدمها مرتين
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            // تخزين الاستجابة في الكاش
            cache.put(event.request, responseClone);
          });
          
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال بالشبكة، استخدم الكاش
        return caches.match(event.request);
      })
  );
});

// تحديث الكاش عند تثبيت نسخة جديدة من Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // حذف الكاش القديم
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
