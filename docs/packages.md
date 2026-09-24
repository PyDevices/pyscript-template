# Bringing in a bigger app

The starter `main.py` needs only the display core, so `pyscript.json` lists a
handful of PyDevices source files. An app that makes sound, uses
`pygraphics`, or is built on LVGL needs more than that. This page is how you
give it more, using piano and the drum machine from
[pydevices-examples](https://github.com/PyDevices/pydevices-examples) as the
worked examples.

## Use the pydevices wheel instead of the file list

`audiodev` alone is fourteen files, so stop listing sources one by one.
PyScript's `packages` takes wheel URLs, and the `pydevices` wheel carries the
whole core (`displaydev`, `audiodev`, `appdev`, `events`, `keys`,
`multimer`). Two files still come from the source tree: the browser board
package, `board_config.py` and `board_peripherals.py`.

Packages with C in them (`pydevices-audiodsp` for `synthio`,
`pydevices-pygraphics`, `pydevices-lvgl`) publish a WebAssembly wheel on
TestPyPI. Use the one tagged `cp314-cp314-pyemscripten_2026_0_wasm32`: that is
the build for the Pyodide inside PyScript 2026.7.3, which
`scripts/vendor_pyscript.sh` pins. If you change `PYSCRIPT_VERSION`, check the
new Pyodide's ABI (`vendor/pyscript/pyodide/pyodide-lock.json`, `info.abi_version`)
and pick the wheel that matches.

To find a wheel's URL, open the project's **Download files** page on TestPyPI
(for example <https://test.pypi.org/project/pydevices-audiodsp/#files>), or
ask the JSON API:

```bash
curl -s https://test.pypi.org/pypi/pydevices-audiodsp/0.6.0/json |
  python3 -c "import json,sys; [print(u['url']) for u in json.load(sys.stdin)['urls'] if 'pyemscripten_2026' in u['filename']]"
```

## Piano

Copy `lib/examples/piano.py` over `main.py`. Its `pyscript.json`:

```json
{
  "packages": [
    "https://test-files.pythonhosted.org/packages/db/7d/8cae60d7482373307813bcf7f3c74f1dd8ff8e41589e3fb1c4e29cfa258e/pydevices-0.5.2-py3-none-any.whl",
    "https://test-files.pythonhosted.org/packages/0a/c7/d1ca995d58cb486abca7350c9c5a3a7625a25df932d77e9cfe74d6fcffde/pydevices_audiodsp-0.6.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://test-files.pythonhosted.org/packages/84/a9/7ad7a06ce103b51dded56f671254a9f1075ee140b80da2bce8e29f5a4ebf/pydevices_pygraphics-0.0.39-cp314-cp314-pyemscripten_2026_0_wasm32.whl"
  ],
  "files": {
    "https://raw.githubusercontent.com/PyDevices/pydevices/v0.5.2/board_configs/psdisplay/board_config.py": "./board_config.py",
    "https://raw.githubusercontent.com/PyDevices/pydevices/v0.5.2/board_configs/psdisplay/board_peripherals.py": "./board_peripherals.py"
  }
}
```

## Drum machine

The drum machine is two packages: the app in `lib/examples/drum_machine/` and
its instrument panel in `lib/examples/drum_seq/`. Copy
`drum_machine/drum_machine.py` over `main.py` and copy the `drum_seq/` folder
next to it. It also needs LVGL and `audioinstruments` (pure Python, so its
ordinary wheel works):

```json
{
  "packages": [
    "https://test-files.pythonhosted.org/packages/db/7d/8cae60d7482373307813bcf7f3c74f1dd8ff8e41589e3fb1c4e29cfa258e/pydevices-0.5.2-py3-none-any.whl",
    "https://test-files.pythonhosted.org/packages/0a/c7/d1ca995d58cb486abca7350c9c5a3a7625a25df932d77e9cfe74d6fcffde/pydevices_audiodsp-0.6.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://test-files.pythonhosted.org/packages/d1/86/cd7720dd24b3da3c9083b57b1bd7e12959d49ec951c6796eeeb287c7da80/pydevices_lvgl-9.5.45-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
    "https://test-files.pythonhosted.org/packages/3b/d9/f994c6a9bcb6b7ff67be8afcc62cdda3fb52fab0eb7e3081bf6c9465f2a3/pydevices_audioinstruments-0.3.1-py3-none-any.whl"
  ],
  "files": {
    "https://raw.githubusercontent.com/PyDevices/pydevices/v0.5.2/board_configs/psdisplay/board_config.py": "./board_config.py",
    "https://raw.githubusercontent.com/PyDevices/pydevices/v0.5.2/board_configs/psdisplay/board_peripherals.py": "./board_peripherals.py",
    "./drum_seq/__init__.py": "./drum_seq/__init__.py",
    "./drum_seq/panel.py": "./drum_seq/panel.py"
  }
}
```

## Things you will want to change

- **Canvas size.** `style.css` draws the canvas at most 320 CSS pixels wide.
  The app sets the canvas's real size; the CSS only scales it. Piano (480×320)
  and the drum machine (720×480) are easier to use wider: raise the `320px`
  in the `canvas` rule to the app's width. That also sidesteps a pydevices
  0.5.2 bug where a mouse click on a shrunken canvas lands in the wrong place
  ([pydevices#69](https://github.com/PyDevices/pydevices/pull/69); touch is
  not affected).
- **Name and icon.** `manifest.json` (`name`, `short_name`), the `<title>` and
  heading in `index.html`, and the two icons.
- **Sound.** Browsers start audio only after a click or tap on the page, so
  the first note may need one.

Offline works the same as for the starter: the service worker caches what the
first visit loads, wheels included.
