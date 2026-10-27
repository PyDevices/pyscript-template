# Run your Python in Web Workers

By default the template runs your Python on the page's main thread, which
is simple and fine for most apps. When your app redraws a lot *and* has to
react on time, to Web MIDI, live audio or fast input, a long redraw
on the main thread delays everything else. The fix is to run your Python in
Web Workers and keep the page thin. `workers/` is a small kit for that:

| File | Runs on | Does |
|---|---|---|
| `workers/host.js` | the page | starts workers, hands a canvas to one of them and relays its input, relays Web MIDI, owns the `AudioContext` |
| `workers/python_worker.js` | each worker | loads Pyodide, installs your wheels, copies your files in, runs your module |
| `workers/audio_worklet.js` | the audio thread | plays the audio a worker sends, with a queue that adapts to the machine |

## A page that runs its app in a worker

```html
<canvas id="display_canvas"></canvas>
<script type="module">
  import { startWorker } from "./workers/host.js";
  const canvas = document.getElementById("display_canvas");
  canvas.width = 800; canvas.height = 480;
  startWorker({
    name: "app", main: "main", canvas,
    packages: ["vendor/wheels/pydevices-<version>-py3-none-any.whl"],
    files: { "main.py": "main.py" },
  });
</script>
```

In `main.py`, use the worker board config and everything else works as on
the page, including LVGL's `display_driver`:

```python
import board_config   # pydevices' board_configs/workerdisplay, copied in as board_config.py
import appdev
app = appdev.App(board_config)
```

`files` maps a URL (relative to the site root) to a path in the worker's
file system; that's how `board_config.py` and `board_peripherals.py` from
`board_configs/workerdisplay` get in. Pointer, wheel and key events on the
canvas reach `appdev` exactly as `PSDisplay` delivers them.

## Sound

```js
import { createAudio, resumeOnGesture } from "./workers/host.js";
const audio = await createAudio({ channels: 1 });
startWorker({ ..., ports: { audio: audio.workerPort } });
resumeOnGesture(audio.context);   // browsers start audio on the first click or key
```

For more than one audio worker, each rendering part of the app on its own
core, give each its own stream: `ports: { audio: audio.addStream() }`. The
worklet sums the streams. A worker that's about to be busy for a while
(building an instrument, say) can post `{pause: true}` on its audio port, and
`{pause: false}` when it's done: the worklet plays its stream as silence
meanwhile instead of counting dropouts. Keep the number of streams to what
you need: each one is asked for audio every 2.7 ms.

In the worker, `from js import ports` and hand `ports.audio` to
`audiodev.worklet_audio` (pydevices): set `WorkletOutput(ports.audio).source`
to a function that renders blocks, or use its `pcm_out(port=ports.audio)` like
any other audio output. The worklet keeps about 32 ms queued at first and
works down to about 16 ms when the machine keeps up. After a dropout it
queues more for a couple of seconds, then comes back down in one step once
the workers keep up again; dropouts that keep coming hold it up longer.

## Web MIDI

```js
import { createMidiRelay } from "./workers/host.js";
const midi = createMidiRelay();
startWorker({ ..., ports: { midi: midi.port() } });
```

In the worker, `midiports.webmidi.relay_ports(ports.midi)` gives
`adafruit_midi.MIDI` its ports. Every input is relayed with its timestamp,
and what you write goes to the page's outputs. Call `midi.port()` once per
worker that should hear MIDI.

## Talking to the page

Things only the page can do, like the browser's file pickers, go through app
messages. From Python, `js.self.postMessage({"type": "app", ...})` arrives in
the page's `handle.onmessage`. The page answers with `handle.send({...})`,
which Python receives by setting `js.self.onPageMessage` to a function.

## Serving it

Workers load as modules and Pyodide fetches its files, so serve the site
over HTTP (`python -m http.server`), as for the rest of the template. The
service worker caches the kit like any other file once it is listed.
