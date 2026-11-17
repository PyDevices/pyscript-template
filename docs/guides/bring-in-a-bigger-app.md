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
PyPI. Use the one tagged `cp314-cp314-pyemscripten_2026_0_wasm32`: that is
the build for the Pyodide inside PyScript 2026.7.3, which
[`scripts/vendor_pyscript.sh`](../../scripts/vendor_pyscript.sh) pins. If you change `PYSCRIPT_VERSION`, check the
new Pyodide's ABI (`vendor/pyscript/pyodide/pyodide-lock.json`, `info.abi_version`)
and pick the wheel that matches.

To find a wheel's URL, open the project's **Download files** page on PyPI
(for example <https://pypi.org/project/omnipython-audiodsp/#files>), or
ask the JSON API:

```bash
curl -s https://pypi.org/pypi/omnipython-audiodsp/0.6.16/json |
  python3 -c "import json,sys; [print(u['url']) for u in json.load(sys.stdin)['urls'] if 'pyemscripten_2026' in u['filename']]"
```

## Piano

Copy gallery's `lib/examples/piano.py` over `main.py`. Its `pyscript.json`:

```json
{
  "packages": [
    "https://files.pythonhosted.org/packages/c7/12/b54d393645f889b78095288ed0573d38cd65cb0e82acec0e05a45c20f8d7/omnipython-0.8.0-py3-none-any.whl",
    "https://files.pythonhosted.org/packages/01/0e/4944aa2baf98d342439ccdf9c7b929be06470b9245dac8252ab95a9fa6e1/omnipython_audiodsp-0.6.16-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://files.pythonhosted.org/packages/be/52/e1ea5f109496c147ffdf085c002adadf1714c5c7fe499d918731f9cd7940/omnipython_pygraphics-0.2.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl"
  ],
  "files": {
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0/board_configs/psdisplay/board_config.py": "./board_config.py",
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0/board_configs/psdisplay/board_peripherals.py": "./board_peripherals.py"
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
    "https://files.pythonhosted.org/packages/c7/12/b54d393645f889b78095288ed0573d38cd65cb0e82acec0e05a45c20f8d7/omnipython-0.8.0-py3-none-any.whl",
    "https://files.pythonhosted.org/packages/01/0e/4944aa2baf98d342439ccdf9c7b929be06470b9245dac8252ab95a9fa6e1/omnipython_audiodsp-0.6.16-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://files.pythonhosted.org/packages/25/49/e01aecca58986cded3292a42381f65b0e48e9365cccc70fd77648f5c63c7/omnipython_lvgl-9.6.1-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://files.pythonhosted.org/packages/ef/4d/58321b39f5bf6fa53ddb31cd6dff1b44491beaf82055198b94ab5556122a/omnipython_audioinstruments-0.5.2-py3-none-any.whl"
  ],
  "files": {
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0/board_configs/psdisplay/board_config.py": "./board_config.py",
    "https://raw.githubusercontent.com/PyDevices/omnipython/v0.8.0/board_configs/psdisplay/board_peripherals.py": "./board_peripherals.py"
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
