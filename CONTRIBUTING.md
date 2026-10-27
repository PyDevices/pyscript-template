# Contributing

Bug reports and fixes are welcome. Open an
[issue](https://github.com/PyDevices/pyscript-template/issues) first for
anything larger than a fix.

## Run the tests

```bash
./scripts/vendor_pyscript.sh
python3 -m unittest discover -s tests -v
```

The suite checks that the shell, service worker, manifest and `pyscript.json`
agree: the JSON parses, every local file `index.html` and `sw.js` mention
exists, the PyDevices source URLs are pinned to the release the test names, the
page uses the Pyodide interpreter, and `pwa.js` leaves the browser's own install
prompt alone. Two tests also run `tests/worklet_sim.mjs` under Node to check the
audio worklet's queue. It does not replace a real browser test of pointer
input, installation or offline caching.

Read `tests/test_template.py` before moving a shell file or adding a generated
asset to the cache list.

## Update a pin

- **PyScript.** Change `PYSCRIPT_VERSION` in `scripts/vendor_pyscript.sh`.
  Check <https://pyscript.net/releases/> and confirm
  `https://pyscript.net/releases/<version>/offline_<version>.zip` returns 200
  before committing. Re-run `./scripts/vendor_pyscript.sh` and the tests.
  The wheel tag in [Bring in a bigger
  app](docs/guides/bring-in-a-bigger-app.md) depends on the Pyodide that
  release ships.
- **PyDevices sources.** Every URL in `pyscript.json` names one PyDevices
  release. Change them together and update the release string in
  `tests/test_template.py`, then load the app in a browser.
- **Cache.** Change `VERSION` in `sw.js` whenever you change a cached file, so
  browsers that already have the app pick the change up.

## Docs

The pages are plain Markdown under `docs/`, starting at
[docs/index.md](docs/index.md). There is no docs build. Check that any link you
add resolves.

## Releasing

The template has no packages and no version of its own: a change is released
by merging it to `main`, and users get it the next time they press **Use this
template** or pull.
