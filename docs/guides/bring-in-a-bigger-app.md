# Bringing in a bigger app

The starter [`main.py`](../../main.py) needs only the display core, so [`pyscript.json`](../../pyscript.json) lists a
handful of OmniPython source files. An app that makes sound, uses
`pygraphics`, or is built on LVGL needs more than that. This page is how you
give it more, using piano and the drum machine from
[gallery](https://github.com/PyDevices/gallery) as the
worked examples.

## Use the omnipython wheel instead of the file list

`audiodev` alone is a dozen or more files, so stop listing sources one by one.
PyScript's `packages` takes wheel URLs, and the `omnipython` wheel carries the
whole core (`displaydev`, `audiodev`, `appdev`, `events`, `keys`,
`multimer`). Two files still come from the source tree: the browser board
package, `board_config.py` and `board_peripherals.py`.

Packages with C in them (`omnipython-audiodsp` for `synthio`,
`omnipython-pygraphics`, `omnipython-lvgl`) publish a WebAssembly wheel on
TestPyPI. Use the one tagged `cp314-cp314-pyemscripten_2026_0_wasm32`: that is
the build for the Pyodide inside PyScript 2026.7.3, which
[`scripts/vendor_pyscript.sh`](../../scripts/vendor_pyscript.sh) pins. If you change `PYSCRIPT_VERSION`, check the
new Pyodide's ABI (`vendor/pyscript/pyodide/pyodide-lock.json`, `info.abi_version`)
and pick the wheel that matches.

To find a wheel's URL, open the project's **Download files** page on TestPyPI
(for example <https://test.pypi.org/project/omnipython-audiodsp/#files>), or
ask the JSON API:

```bash
curl -s https://test.pypi.org/pypi/omnipython-audiodsp/0.6.16.dev4/json |
  python3 -c "import json,sys; [print(u['url']) for u in json.load(sys.stdin)['urls'] if 'pyemscripten_2026' in u['filename']]"
```

## Piano

Copy gallery's `lib/examples/piano.py` over `main.py`. Its `pyscript.json`:

```json
{
  "packages": [
    "https://test-files.pythonhosted.org/packages/32/88/70a5800044046b6524c1861bba2426b623fcd4c62cb72149c127aed0cbd7/omnipython-0.8.0.dev24-py3-none-any.whl",
    "https://test-files.pythonhosted.org/packages/10/49/aad85c058839ac988315a289947a6ad313e9e262aa8afc65b3d07b6efac6/omnipython_audiodsp-0.6.16.dev4-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://test-files.pythonhosted.org/packages/e4/5c/47a5dc1c7f4213b31c31fcd510a37f102c7e8290174416d3947917c0f1f2/omnipython_pygraphics-0.1.7.dev2-cp314-cp314-pyemscripten_2026_0_wasm32.whl"
  ],
  "files": {
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0.dev24/board_configs/psdisplay/board_config.py": "./board_config.py",
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0.dev24/board_configs/psdisplay/board_peripherals.py": "./board_peripherals.py"
  }
}
```

## Drum machine

The drum machine is one file, gallery's `lib/examples/drum_machine/drum_machine.py`.
Copy it over `main.py`. It also needs LVGL and `audioinstruments` (pure Python,
so its ordinary wheel works), and its PANEL button opens the instrument panel
that `audioinstruments` carries:

```json
{
  "packages": [
    "https://test-files.pythonhosted.org/packages/32/88/70a5800044046b6524c1861bba2426b623fcd4c62cb72149c127aed0cbd7/omnipython-0.8.0.dev24-py3-none-any.whl",
    "https://test-files.pythonhosted.org/packages/10/49/aad85c058839ac988315a289947a6ad313e9e262aa8afc65b3d07b6efac6/omnipython_audiodsp-0.6.16.dev4-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://test-files.pythonhosted.org/packages/81/35/7e6eb12cd4f4f2b4767c8b1a0e370e6631246608958941934e303b3c0e68/omnipython_lvgl-9.6.1.dev0-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://test-files.pythonhosted.org/packages/30/2b/84b401ecbc2a50328b79fc4a556117d8e3f8f8eb768b30dda51c5772fbd4/omnipython_audioinstruments-0.5.2.dev6-py3-none-any.whl"
  ],
  "files": {
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0.dev24/board_configs/psdisplay/board_config.py": "./board_config.py",
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0.dev24/board_configs/psdisplay/board_peripherals.py": "./board_peripherals.py"
  }
}
```

## Things you will want to change

- **Canvas size.** The template's `main.py` sets the display to 500×500
  with `env_set("OMNIPYTHON_WIDTH", ...)` and `OMNIPYTHON_HEIGHT` before it
  imports `board_config`. Set them to your app's size (piano is 480×320, the
  drum machine 720×480); the canvas takes whatever size the display is. The
  template uses 500 because Chrome won't make an installed app's window any
  narrower.
- **Name and icon.** [`manifest.json`](../../manifest.json) (`name`, `short_name`), the `<title>` and
  heading in [`index.html`](../../index.html), and the two icons.
- **Sound.** Browsers start audio only after a click or tap on the page, so
  the first note may need one.

Offline works the same as for the starter: the service worker caches what the
first visit loads, wheels included.
