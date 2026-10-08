# PyDevices PyScript template

A minimal, installable PyScript application for the portable
[PyDevices](https://github.com/PyDevices/pydevices) display stack.

Use this repository as a GitHub template, edit `main.py`, and run it on your
own machine with Python's built-in web server ([below](#run-it-locally)). The
service worker caches the application shell and the pinned PyScript
interpreter, so after one visit the app launches offline too. The template
pins PyDevices source files to release `v0.7.0`, so a new app does not
silently change when the product's default branch advances.

## Starter Example: Interactive Touch / Paint

This is exactly what ships in `main.py` — an interactive paint application
demonstrating the PyDevices Board Contract (`board_config` and
`appdev.App`) running in the browser:

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
3. **Installable and offline**: the service worker caches the PyScript interpreter and application shell, so the app installs and runs offline on desktop and mobile browsers. A small note near the top right tells visitors how their browser installs it, and an installed app opens in a window sized to the display `board_config` asks for. [The PWA guide](docs/pwa-guide.md) has the details.

## Documentation

- [Newcomer's guide](docs/newcomers.md) — how the template becomes a browser app, and which generated boundaries to preserve.
- [Make your PyScript app a PWA](docs/pwa-guide.md) — where it installs, the
  manifest, the service worker, the app window, and edits that don't show.
  The template already ships everything that guide describes.

What's planned next is in [ROADMAP.md](ROADMAP.md).

## Customize

- Edit `main.py` for application behavior.
- Edit `pyscript.json` to add PyDevices source files or Pyodide packages. For
  an app that makes sound or uses LVGL, such as piano or the drum machine from
  pydevices-examples, see [Bringing in a bigger app](docs/packages.md).
- Change the app name, colors, and icons in `index.html`, `manifest.json`, and `style.css`.
- Change `PYSCRIPT_VERSION` in `scripts/vendor_pyscript.sh` when you choose to
  update the browser interpreter. Check the
  [PyScript releases page](https://github.com/pyscript/pyscript/releases) or
  <https://pyscript.net/releases/> for newer versions before bumping the pin,
  and confirm `https://pyscript.net/releases/<version>/offline_<version>.zip`
  returns 200 before committing the change.

## Run it locally

From the repository root:

```bash
./scripts/vendor_pyscript.sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The first command downloads the pinned
PyScript release into `vendor/` (it is `.gitignore`d, so run it once per
checkout and again after you change the pin).

Use that `localhost` address rather than opening `index.html` from disk or
browsing to the machine's LAN IP. Service workers, which make the app
installable and offline, only run on `http://localhost` or over `https://`.

The service worker serves every file from its cache once it has one, so an
edit to `main.py` can look as if it did nothing. While you work, reload with
**Ctrl+Shift+R** (**Cmd+Shift+R** on a Mac), or open DevTools → Application →
Service workers and tick **Bypass for network**. [Edits that don't
show](docs/pwa-guide.md#edits-that-dont-show) has the rest.

## Verify

```bash
python3 -m unittest discover -s tests -v
```

The template uses only the `py` interpreter (Pyodide) for the broadest pip-wheel path. The same PyDevices source packages remain portable to MicroPython, CircuitPython, and CPython desktop; use the [direct MicroPython WebAssembly Gallery](https://pydevices.github.io/pydevices-examples/gallery/) for the first-party direct host and complete cross-interpreter examples.

MIT licensed. See `LICENSE`.
