/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin, CacheableResponsePlugin } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache de imagens do Supabase Storage
    {
      matcher: ({ url }) => url.hostname === 'fmmykrcqpguqihidolfj.supabase.co' && url.pathname.startsWith('/storage/'),
      handler: new CacheFirst({
        cacheName: "supabase-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },
    // Cache de imagens do Clerk
    {
      matcher: ({ url }) => url.hostname === 'img.clerk.com' || url.hostname === 'images.clerk.dev',
      handler: new CacheFirst({
        cacheName: "clerk-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },
    // Cache de fontes do Google
    {
      matcher: ({ url }) => url.hostname === 'fonts.googleapis.com',
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
      }),
    },
    {
      matcher: ({ url }) => url.hostname === 'fonts.gstatic.com',
      handler: new CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },
    // Cache de assets estáticos
    {
      matcher: ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font',
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
          }),
        ],
      }),
    },
    // Cache de API - dados do usuário (curta duração)
    {
      matcher: ({ url }) => url.pathname === '/api/user',
      handler: new NetworkFirst({
        cacheName: "api-user",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1,
            maxAgeSeconds: 5 * 60, // 5 minutos
          }),
        ],
      }),
    },
    // Cache de API - propriedades
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/properties'),
      handler: new NetworkFirst({
        cacheName: "api-properties",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 15 * 60, // 15 minutos
          }),
        ],
      }),
    },
    // Cache de API - vistorias
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/inspections'),
      handler: new NetworkFirst({
        cacheName: "api-inspections",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 15 * 60, // 15 minutos
          }),
        ],
      }),
    },
    // Default: cache padrão do Next.js
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

// Background Sync para uploads de fotos offline
self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-photos") {
    event.waitUntil(syncPhotos());
  }
});

// Função para sincronizar fotos quando voltar online
async function syncPhotos() {
  const db = await openDB();
  const tx = db.transaction("pending-photos", "readonly");
  const store = tx.objectStore("pending-photos");

  return new Promise<void>((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = async () => {
      const pendingPhotos = request.result;

      for (const photo of pendingPhotos) {
        try {
          const response = await fetch("/api/inspections/photos/upload", {
            method: "POST",
            body: photo.formData,
            credentials: "include",
          });

          if (response.ok) {
            // Remove da fila após sucesso
            const deleteTx = db.transaction("pending-photos", "readwrite");
            deleteTx.objectStore("pending-photos").delete(photo.id);
          }
        } catch (error) {
          console.error("Failed to sync photo:", photo.id, error);
        }
      }
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

// IndexedDB helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vistoria-offline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("pending-photos")) {
        db.createObjectStore("pending-photos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("draft-inspections")) {
        db.createObjectStore("draft-inspections", { keyPath: "id" });
      }
    };
  });
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "VistorIA Pro", {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: data.tag || "default",
      data: data.url,
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data)
    );
  }
});
