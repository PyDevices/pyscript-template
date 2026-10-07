# Progressive Web App (PWA) Guide for PyScript

This template is already an installable, offline-capable app. Your PyScript
application can:

1. **Install** to the home screen, dock, Start menu or app launcher.
2. **Work offline** after one visit, from the cached application shell and
   Python runtime.
3. **Run in its own window**, without the browser's address bar, sized to the
   display your `board_config` asks for.

## Where PWAs install

| Browser | How you install | What you get | What the template's note says |
|---|---|---|---|
| **Chrome / Edge** on Windows, macOS, Linux, ChromeOS | The install icon at the right of the address bar | Its own window and a desktop/launcher icon | Points up at that icon |
| **Chrome** on Android | Menu **⋮** → **Install app** (or **Add to Home screen**) | A home-screen app | Points at the menu |
| **Safari** on iPhone / iPad | **Share** → **Add to Home Screen** (on iOS 26, Share is under **⋯**) | A home-screen app | Says so |
| **Safari 17+** on macOS | **File** → **Add to Dock** | A Dock app in its own window | Says so |
| Other Android browsers (Firefox, Samsung Internet) | The browser menu's **Install** or **Add to Home screen** | A home-screen app | Says so |
| **Firefox** on the desktop | Not a full PWA install (Windows has an experimental "Taskbar Tabs" in Firefox Labs) | — | Nothing |

The note is a small bubble near the top right of the page. It never appears
inside the installed app, Chrome and Edge only show it once the browser itself
says the page is installable (the `beforeinstallprompt` event), and closing it
with **×** hides it for good in that browser (it is remembered in
`localStorage`). The browser's own install UI is left untouched: the page
doesn't call `preventDefault()` on `beforeinstallprompt`.

## The files

All of this lives at the repository root:

| File | What it does |
|---|---|
| `index.html` | The page: canvas, status line, PyScript loader |
| `manifest.json` | The app's name, icons, colours and `display: standalone` |
| `sw.js` | The service worker that caches everything for offline use |
| `pwa.js` | Registers the worker, sizes the app window, shows the install note |
| `style.css` | The page in a tab, and the bare canvas in the app window |
| `icon-192.png`, `icon-512.png` | App icons (the 512 is also the maskable one) |
| `vendor/pyscript/` | The pinned PyScript release, made by `scripts/vendor_pyscript.sh` and `.gitignore`d |

### The manifest

[`manifest.json`](../manifest.json) tells the browser how the app appears
once installed. `display: "standalone"` gives it a window with no address bar,
`theme_color` colours the title bar, `background_color` is the splash screen,
and the two icons cover home screens and launchers. Change the names, colours
and icons to make the app yours.

The manifest can't say how big the window should be; there is no such member.
`pwa.js` does that instead ([below](#the-app-window)).

### The service worker

[`sw.js`](../sw.js) caches the shell (`SHELL`) when it installs, then serves
every GET request from its cache first and caches anything new it fetches. On
the first visit the page starts loading before the worker controls it, so
`pwa.js` also hands the worker the URLs the page already loaded and the worker
caches whatever is missing. One online visit is enough for the app to launch
offline.

The cache is named after `VERSION` at the top of `sw.js`. When the worker
starts with a new `VERSION` it deletes every other cache, which is how a
browser that already has your app picks up a changed file.

## The app window

In a tab the page shows its heading, the canvas and the status line. In the
installed app's own window it shows only the canvas, at the size
`board_config` gives the display, and `pwa.js` resizes the window to fit it:
the canvas plus the window's own frame and title bar.

It does that once, when the display first reports its size, and again only if
that size changes (a rotation, say). If you resize the window yourself it
stays the way you left it, and a maximized window is left maximized. A window
bigger than the screen is capped at the screen, and the canvas scales down to
fit.

Browsers decide whether a page may resize its window:

- **Chrome and Edge** on the desktop allow `window.resizeTo()` in an installed
  app's window and refuse it in an ordinary tab. This is the case the template
  is built for.
- **Safari** doesn't document `resizeTo()` for its Dock apps on macOS, and
  WebKit generally allows it only in windows a script opened. Expect the
  window to keep the size macOS gives it; the call does no harm if refused.
- **Firefox** refuses it for any window it didn't open itself.
- On **phones and tablets** the app is full screen, and the canvas scales to
  fit.

In a tab, `pwa.js` never touches the window.

## Run it locally

From the repository root:

```bash
./scripts/vendor_pyscript.sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. A service worker only runs on a secure origin:
`http://localhost` counts, `https://` counts, and a file opened from disk or a
LAN address like `http://192.168.1.20:8000` doesn't. On localhost Chrome and
Edge show their install icon, so you can install the app and try its window
from your own machine.

### Edits that don't show

The service worker answers from its cache before it asks the server, so after
the first visit an ordinary reload brings back the copy of `main.py` (or any
other file) it cached then. While you edit, pick one of these:

- Reload with **Ctrl+Shift+R** (**Cmd+Shift+R** on a Mac). A hard reload skips
  the service worker for that load. The next ordinary reload goes back to the
  cached copies.
- Open DevTools → **Application** → **Service workers** and tick **Bypass for
  network**. Every load goes to the server while DevTools is open.
- Change `VERSION` in `sw.js`. The next reload installs a worker with an empty
  cache, and the reload after that shows your edits. Do this whenever you want
  a browser that already has the app, including an installed copy, to pick up
  your changes.
- To start clean, DevTools → **Application** → **Storage** → **Clear site
  data** removes the worker and its cache.

An installed app keeps its own copy as well: change `VERSION`, or uninstall
and reinstall it.
