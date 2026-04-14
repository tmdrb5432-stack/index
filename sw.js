const CACHE_NAME = 'promotions-ledger-v1';

// 오프라인에서도 작동할 파일 목록
const CACHE_FILES = [
  './promotions_ledger.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 설치: 필요한 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES.map(url => new Request(url, { mode: 'no-cors' })))
        .catch(err => console.log('캐시 일부 실패 (무시):', err));
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// fetch: 네트워크 우선, 실패 시 캐시 사용 (JSONBin API는 항상 네트워크)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // JSONBin API 요청은 캐시하지 않고 항상 네트워크로
  if (url.includes('jsonbin.io')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 그 외: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공하면 캐시 업데이트
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
