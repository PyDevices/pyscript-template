// Runs workers/audio_worklet.js outside a browser: a fake audio thread asks
// for 128 frames per quantum and a fake worker answers every request at once,
// except while `stall` says it can't. Prints the queue target over time as
// JSON lines: {t, target, underruns}.
//
//   node tests/worklet_sim.mjs [stallStart stallSeconds total answer]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [stallStart = 3, stallSeconds = 0.3, total = 12, answer = 1] = process.argv.slice(2).map(Number);
// `answer`: the chance the worker answers in a given quantum (1 = always);
// below 1 its replies come late at random, as a busy machine's do.
let seed = 1;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const sampleRate = 48000;
let Processor = null;
globalThis.sampleRate = sampleRate;
globalThis.currentFrame = 0;
globalThis.AudioWorkletProcessor = class { constructor() { this.port = { postMessage() {}, onmessage: null }; } };
globalThis.registerProcessor = (name, cls) => { Processor = cls; };
const src = readFileSync(process.env.WORKLET || fileURLToPath(new URL("../workers/audio_worklet.js", import.meta.url)), "utf8");
new Function(src)();

const node = new Processor({ processorOptions: { channels: 1, minFrames: 768, startFrames: 1536, maxFrames: 4096 } });
const pending = [];
const workerPort = {
  onmessage: null,
  postMessage(m) { if (m.need) pending.push(m.need); },
};
node.onPage({ data: { type: "worker" }, ports: [workerPort] });
const stream = node.streams[0];
const quanta = Math.round(total * sampleRate / 128);
let lastPrint = -1;
for (let q = 0; q < quanta; q++) {
  const t = q * 128 / sampleRate;
  const stalled = t >= stallStart && t < stallStart + stallSeconds;
  if (!stalled && random() < answer) {
    while (pending.length) {
      const blocks = pending.shift();
      for (let b = 0; b < blocks; b++) stream.port.onmessage({ data: { pcm: new Int16Array(256) } });
    }
  }
  const out = [new Float32Array(128)];
  node.process([], [out]);
  globalThis.currentFrame += 128;
  const tenth = Math.floor(t * 10);
  if (tenth !== lastPrint) {
    lastPrint = tenth;
    console.log(JSON.stringify({ t: tenth / 10, target: node.target, underruns: node.underruns }));
  }
}
