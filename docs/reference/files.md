# Files in the template

| Path | Purpose |
|---|---|
| `index.html` | Application shell: canvas, status text, PyScript loader, and the Python entrypoint declaration. |
| `main.py` | Starter Python application. It constructs `appdev.App(board_config)`, paints the demo, and handles pointer events. |
| `pyscript.json` | Exact remote-file map for the PyDevices modules available to PyScript. |
| `manifest.json` | Browser PWA identity: names, icons, scope, and display mode. |
| `pwa.js` | Registers the service worker, sizes an installed app's window to the display, and shows the note that says how to install. |
| `sw.js` | Caches the app shell and runtime, then caches successful GET responses for offline reuse. The cache is named after `VERSION` in this file. |
| `style.css` | Shell and canvas presentation. |
| `icon-192.png`, `icon-512.png` | App icons. The 512 is also the maskable one. |
| `workers/` | Optional kit for running Python in Web Workers: `host.js`, `python_worker.js`, `audio_worklet.js`. See [Run your Python in Web Workers](../guides/run-in-a-worker.md). |
| `scripts/vendor_pyscript.sh` | Downloads the pinned offline PyScript release into generated `vendor/pyscript/`. Set `PYSCRIPT_VERSION` to override the pin for one run. |
| `vendor/pyscript/` | Generated and ignored by Git. Never hand-edit it. |
