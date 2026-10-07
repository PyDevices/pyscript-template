# Newcomer's guide to the PyDevices PyScript template

This repository is a GitHub template for an installable browser application,
not a shared PyDevices library. Start by using the template to create your own
repository, then make that repository's
`main.py`, application name, icons, and styling yours.

The template runs Python in the browser through PyScript/Pyodide and renders
through the PyDevices display stack on an HTML canvas. Its included paint demo
is deliberately small: it demonstrates the Board Contract (`board_config` and
`appdev.App`), browser pointer events, and a display surface without imposing
an application architecture on the copied project.

## A mental model

```text
http://localhost:8000 (python3 -m http.server)
        |
        v
index.html
  |-- loads vendored PyScript/Pyodide runtime from vendor/pyscript/
  |-- starts main.py with pyscript.json
  `-- registers pwa.js
        |
        v
PyScript fetches pinned PyDevices Python modules
        |
        v
main.py
  |-- board_config creates the browser canvas display
  |-- appdev.App routes pointer events and refreshes the display
  `-- application code draws its UI
        |
        v
sw.js caches the shell and later GET responses for offline reuse
```

The application must be served over HTTP. Opening `index.html` directly
from the filesystem does not provide the origin that PyScript needs, and the
service worker only runs on `http://localhost` or `https://`. The root
README's [Run it locally](../README.md#run-it-locally) has the commands.

## Repository map

| Path | Purpose |
|---|---|
| `index.html` | Application shell: canvas, status text, PyScript loader, and the Python entrypoint declaration. |
| `main.py` | Starter Python application. It constructs `appdev.App(board_config)`, paints the demo, and handles pointer events. |
| `pyscript.json` | Exact remote-file map for the PyDevices modules available to PyScript. |
| `manifest.json` | Browser PWA identity: names, icons, scope, and display mode. |
| `pwa.js` | Registers the service worker, sizes an installed app's window to the display, and shows the note that says how to install. |
| `sw.js` | Caches the app shell and runtime, then caches successful GET responses for offline reuse. |
| `style.css` | Shell and canvas presentation. |
| `scripts/vendor_pyscript.sh` | Downloads the pinned offline PyScript release into generated `vendor/pyscript/`. |
| `.github/workflows/tests.yml` | Vendors PyScript and runs the template's unit tests. |
| `tests/test_template.py` | Checks JSON, source pins, local shell assets, and the Pyodide-only contract. |
| `docs/pwa-guide.md` | Where the app installs, the service worker's cache, the app window, and edits that don't show. |

## Follow the starter application

1. The browser loads `index.html`, which loads the vendored PyScript runtime
   and asks it to run `main.py` with `pyscript.json`.
2. PyScript fetches the PyDevices files listed in `pyscript.json`. They are
   intentionally pinned to one `PyDevices/pydevices` release, so a fresh app
   does not change when the upstream default branch moves.
3. `main.py` imports the pinned `board_config` and `appdev` modules.
   `board_config.display_drv` binds the PyScript display backend to the canvas;
   `appdev.App(board_config)` supplies event dispatch and refresh coordination.
4. The demo draws its colour strip, converts pointer events into a selected
   colour or paint stroke, and calls `display_drv.show()` to present updates.
5. `pwa.js` registers `sw.js`. After an initial online visit, the cached
   shell, runtime and fetched assets enable offline launches. The cache is
   named after `VERSION` in `sw.js`; changing it replaces the old cache.

The template is Pyodide-only: its HTML uses a `type="py"` script. It is not a
direct MicroPython WebAssembly host; use the PyDevices examples Gallery when
that is the target runtime.

## Boundaries worth preserving

- Change the copied application's `main.py`, titles, icons, manifest, and CSS.
- Keep `pyscript.json` source URLs pinned. Updating the PyDevices release is a
  deliberate dependency change: update the complete file map and verify the
  copied application, rather than mixing versions casually.
- `vendor/pyscript/` is generated and ignored by Git. Never hand-edit it;
  change the pinned version in `scripts/vendor_pyscript.sh` and regenerate it.
- The service worker serves cached files first. While developing, hard-reload
  (Ctrl+Shift+R) or tick DevTools' **Bypass for network** when a browser
  appears to serve an old file, and change `VERSION` in `sw.js` when you want
  browsers that already have the app to pick up a change. See
  [Edits that don't show](pwa-guide.md#edits-that-dont-show).
- Keep the app at the repository root. The service worker's scope and its
  cached paths assume it.
- Browser installation and offline behavior need `http://localhost` or an
  `https://` origin and at least one successful online load. They cannot be
  proven by opening a file from disk.

## Start a safe application change

For normal work in a repository created from this template:

1. Edit `main.py` to replace the paint demo with your application behavior.
2. Rename the app in `index.html` and `manifest.json`; replace the icons and
   adjust `style.css` as needed.
3. Add only the PyDevices source files or Pyodide packages the app needs to
   `pyscript.json`.
4. Run the local HTTP preview described in the root README; do not use a
   `file:` URL.
5. Install it from Chrome or Edge on localhost and check that its window fits
   the display and that it launches with the server stopped.

The template tests can be run with:

```bash
python3 -m unittest discover -s tests -v
```

The test suite vendors PyScript if necessary, then verifies that the shell,
service worker, manifest, and configuration agree. It does not replace a real
browser test of pointer input, installation, or offline caching.

## Where to learn next

- Read `main.py` and `pyscript.json` together for the Python application
  boundary and pinned dependency set.
- Read [the PWA guide](pwa-guide.md) before changing service-worker behavior,
  caching, the app window, or installation instructions.
- Read `tests/test_template.py` before moving a shell file or adding a generated
  asset to the cache list.
- For display/event APIs, follow the linked PyDevices source release rather
  than copying its implementation into this template.
