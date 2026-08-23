# PyDevices PyScript template

A minimal, installable PyScript application for the portable
[PyDevices](https://github.com/PyDevices/pydevices) display stack.

Use this repository as a GitHub template, edit `main.py`, and enable GitHub
Pages with **GitHub Actions** as the source. The included workflow deploys the
app, and the service worker caches both the application shell and the pinned
PyScript interpreter for offline launches after the first successful visit.
The template also pins PyDevices source files to release `v0.1.0`, so a new
app does not silently change when the product's default branch advances.

## Starter Example: Interactive Touch / Paint

Below is an interactive paint application demonstrating the PyDevices Board Contract (`board_config` and `appdev.App`) running in the browser:

```python
import board_config
import appdev

display_drv = board_config.display_drv
app = appdev.App(board_config)

colors = [0xFFFF, 0xF800, 0x07E0, 0x001F, 0x07FF, 0xF81F, 0xFFE0, 0x0000]
block_size = display_drv.width // len(colors)
selected = 0

def draw_palette():
    for i, color in enumerate(colors):
        x = i * block_size
        display_drv.fill_rect(x, 0, block_size, 30, color)
    display_drv.show()

draw_palette()

def on_touch(event):
    global selected
    x, y = event.pos
    if y < 30:
        selected = min(len(colors) - 1, x // block_size)
    else:
        display_drv.fill_rect(x - 3, y - 3, 6, 6, colors[selected])
        display_drv.show()

app.on(app.events.MOUSEBUTTONDOWN, on_touch)
app.on(app.events.MOUSEMOTION, on_touch)
app.run()
```

## How It Works

1. **HTML5 Canvas Backend**: `board_config.display_drv` binds to the `<canvas>` element through the supported PyScript/Pyodide `PSDisplay` backend. This template is intentionally Pyodide-only; direct MicroPython WebAssembly applications use the Gallery host instead.
2. **Browser Event Loop**: `app.run()` integrates cooperatively with the browser's native JavaScript event loop to dispatch pointer/touch events.
3. **Automated PWA Caching**: The included GitHub Actions workflow and service worker cache the PyScript interpreter and application shell so users can install and run the app offline on desktop or mobile browsers.

## Documentation

- [Make your PyScript app a PWA](docs/pwa-guide.md) — host/install matrix,
  manifest, service worker, cross-origin isolation, deployment, and offline
  caching. The template already ships everything that guide describes.

## Customize

- Edit `main.py` for application behavior.
- Edit `pyscript.json` to add PyDevices source files or Pyodide packages.
- Change the app name, colors, and icons in `index.html`, `manifest.json`, and `style.css`.
- Change `PYSCRIPT_VERSION` in `scripts/vendor_pyscript.sh` when you choose to update the browser interpreter.

## Preview locally

```bash
./scripts/vendor_pyscript.sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Do not open `index.html` directly from the filesystem; PyScript and service workers require an HTTP origin.

## Verify

```bash
python3 -m unittest discover -s tests -v
```

The template uses only the `py` interpreter (Pyodide) for the broadest pip-wheel path. The same PyDevices source packages remain portable to MicroPython, CircuitPython, and CPython desktop; use the [direct MicroPython WebAssembly Gallery](https://pydevices.github.io/pydevices-examples/gallery/) for the first-party direct host and complete cross-interpreter examples.

MIT licensed. See `LICENSE`.
