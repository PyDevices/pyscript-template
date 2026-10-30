# Make your first app

## Use the template

On GitHub, press **Use this template** on the
[pyscript-template](https://github.com/PyDevices/pyscript-template)
page to make your own repository, or clone it:

```bash
git clone https://github.com/PyDevices/pyscript-template my-app
cd my-app
```

## Run it locally

From the repository root:

```bash
./scripts/vendor_pyscript.sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The first command downloads the pinned
PyScript release into `vendor/` (it is `.gitignore`d, so run it once per
checkout and again after you change the pin). You should see a row of eight
colour blocks above a black canvas. Click a block, then click or drag on the
canvas to paint.

Use that `localhost` address rather than opening `index.html` from disk or
browsing to the machine's LAN IP. Service workers, which make the app
installable and offline, only run on `http://localhost` or over `https://`.

The service worker serves every file from its cache once it has one, so an
edit to [`main.py`](../../main.py) can look as if it did nothing. While you work, reload with
**Ctrl+Shift+R** (**Cmd+Shift+R** on a Mac), or open DevTools, Application,
Service workers and tick **Bypass for network**. [Edits that don't
show](../guides/make-it-installable.md#edits-that-dont-show) has the rest.

## Make it yours

1. Edit `main.py` to replace the paint demo with your application.
2. Rename the app in [`index.html`](../../index.html) and [`manifest.json`](../../manifest.json), replace the two icons
   and adjust `style.css`.
3. Add only the PyDevices source files or Pyodide packages the app needs to
   [`pyscript.json`](../../pyscript.json). For an app that makes sound or uses LVGL, see
   [Bring in a bigger app](../guides/bring-in-a-bigger-app.md).
4. Install it from Chrome or Edge on localhost, check that its window fits the
   display, and check that it launches with the server stopped. The steps are in
   [Make your app installable and offline](../guides/make-it-installable.md).
