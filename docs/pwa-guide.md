# Progressive Web App (PWA) Guide for PyScript

Build and deploy installable, offline-capable Python applications in the browser using PyDevices and PyScript.

## Overview

This template provides a **100% standalone** Progressive Web App (PWA) setup that allows your PyScript application to:
1. **Install natively** to the user's home screen or desktop application menu.
2. **Work offline** by caching the application shell, Python runtime, and assets.
3. **Run in standalone window mode** without browser address bars or navigation controls.

## Where PWAs Run

| Host Platform | Install UX | Result |
|---|---|---|
| **Desktop Chrome / Edge** (Windows, macOS, Linux) | Address bar install icon or **Install** button | Standalone window with dedicated desktop icon |
| **Android Chrome** | **Install app** prompt or browser menu **Add to Home screen** | Standalone Android application window |
| **Chromebook (ChromeOS)** | Address bar install icon or launcher install prompt | Dedicated application window pinned to the shelf |
| **iOS / iPadOS Safari** | **Share → Add to Home Screen** | Fullscreen standalone WebKit app container |
| **Smart TVs** (webOS, Tizen) | Direct Chromium browser access | Runs directly in the TV web runtime |

> [!NOTE]
> Safari on iOS does not fire the `beforeinstallprompt` event. Users install the app via **Share → Add to Home Screen**.

## Template Architecture

This template includes everything required for an offline PWA at the repository root:

```
pyscript-template/
├── index.html         # Application shell loading PyScript, Canvas, and PWA scripts
├── main.py            # Application entry point using pydevices / displaydev
├── pyscript.json      # PyScript configuration and dependencies
├── manifest.json      # Web App Manifest defining app name, icons, and theme
├── sw.js              # Service Worker for caching and offline execution
├── pwa.js             # Service Worker registration and install prompt handler
├── style.css          # Application and UI styling
├── icon-192.png       # 192x192 PNG application icon
├── icon-512.png       # 512x512 PNG maskable application icon
└── .github/workflows/
    └── deploy.yml     # Automated GitHub Pages deployment workflow
```

---

## Key Components

### 1. Web App Manifest (`manifest.json`)

`manifest.json` tells the browser how your application should appear when installed:

```json
{
  "name": "My PyDevices App",
  "short_name": "PyDevices App",
  "description": "A cross-platform Python display application built with PyDevices and PyScript.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#100e0b",
  "theme_color": "#f54e00",
  "icons": [
    {
      "src": "./icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- **`display: "standalone"`**: Launches the app in its own window without browser chrome.
- **`theme_color` / `background_color`**: Sets the OS title bar and splash screen background.
- **`icons`**: Specifies standard and maskable icons for device home screens and app launchers.

---

### 2. Service Worker (`sw.js`)

`sw.js` caches all application shell resources on installation and serves cached assets when offline:

```javascript
const CACHE_NAME = 'pyscript-template-v1';
const SHELL = [
  './',
  './index.html',
  './main.py',
  './pyscript.json',
  './manifest.json',
  './style.css',
  './pwa.js',
  './icon-192.png',
  './icon-512.png',
  './vendor/pyscript/core.css',
  './vendor/pyscript/core.js',
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(SHELL);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (name) {
      return name !== CACHE_NAME;
    }).map(function (name) {
      return caches.delete(name);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(function (cached) {
    if (cached) return cached;
    return fetch(event.request).then(function (response) {
      if (!response || response.status !== 200) return response;
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, copy);
      });
      return response;
    });
  }));
});
```

---

### 3. PWA Installer & Lifecycle (`pwa.js`)

`pwa.js` handles registering the Service Worker and managing the custom install prompt button:

```javascript
(function () {
  var installButton = document.getElementById('install');
  var deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {scope: './'}).catch(console.error);
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  if (installButton) {
    installButton.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        installButton.hidden = true;
      });
    });
  }

  window.addEventListener('appinstalled', function () {
    if (installButton) installButton.hidden = true;
  });
})();
```

---

## Deployment to GitHub Pages

1. In your GitHub repository, navigate to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main`. The included `.github/workflows/deploy.yml` workflow automatically publishes the application to `https://<user>.github.io/<repo>/`.

Once published:
- Visit the site on desktop Chrome or Android to test the **Install** button.
- Visit on iOS Safari, tap the Share button, and select **Add to Home Screen**.
- Disconnect network connectivity to verify offline execution.
