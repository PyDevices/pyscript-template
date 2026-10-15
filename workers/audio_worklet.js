// The AudioWorklet end of a Python worker's audio (audiodev.worklet_audio).
//
// It plays 256-frame blocks of int16 PCM the worker sends and asks for more
// over a MessagePort, keeping a queue of `target` frames:
//
//   worklet -> worker  {need: blocks, asked: frame}   send that many blocks
//   worker -> worklet  {pcm: Int16Array, asked}       (transferred, interleaved)
//   worklet -> worker  {offset}                       rendered frame k plays at
//                                                     context frame k + offset
//   worklet -> worker  {underrun: count}           underruns since the last one
//
// The queue adapts: it starts at `startFrames`, steps down 256 frames at a
// time towards `minFrames` while its low point stays above 512 frames for two
// seconds, and steps up 512 frames (to at most `maxFrames`) on any underrun,
// then holds for ten seconds. The browser's audio thread asks for audio about
// every 10 ms, so a queue much under 768 frames can't keep up.
//
// The node's own port (to the page) answers {type: "stats"} and, when a test
// asks with {type: "tap", on: true}, posts a copy of every frame played.

const BLOCK = 256;

class PythonWorkerOutput extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = options.processorOptions || {};
    this.channels = o.channels || 1;
    this.minFrames = o.minFrames || 768;
    this.maxFrames = o.maxFrames || 4096;
    this.target = o.startFrames || 1536;
    this.queue = [];
    this.head = 0;            // sample index into queue[0]
    this.queued = 0;          // frames queued
    this.requested = 0;       // frames asked for, not yet here
    this.played = 0;          // queued frames played so far
    this.offset = null;
    this.worker = null;
    this.started = false;
    this.underruns = 0;
    this.windowLow = Infinity;
    this.windowStart = 0;
    this.holdUntil = 0;
    this.low = Infinity;      // low point since the last stats request
    this.tap = null;
    this.tapAt = 0;
    this.tapStart = 0;
    this.port.onmessage = (e) => this.onPage(e);
  }

  onPage(e) {
    const m = e.data;
    if (m.type === "worker") {
      this.worker = e.ports[0];
      this.worker.onmessage = (ev) => {
        const pcm = ev.data.pcm;
        if (!pcm) return;
        const frames = pcm.length / this.channels;
        this.queue.push(pcm);
        this.queued += frames;
        this.requested = Math.max(0, this.requested - frames);
      };
      this.ask();
    } else if (m.type === "stats") {
      this.port.postMessage({ type: "stats", underruns: this.underruns, target: this.target,
        queued: this.queued, low: this.low, frame: currentFrame });
      this.low = Infinity;
    } else if (m.type === "tap") {
      this.tap = m.on ? new Float32Array(Math.floor(sampleRate / 2) * this.channels) : null;
      this.tapAt = 0;
    }
  }

  ask() {
    const short = this.target - this.queued - this.requested;
    if (short > 0 && this.worker) {
      const blocks = Math.ceil(short / BLOCK);
      this.requested += blocks * BLOCK;
      this.worker.postMessage({ need: blocks, asked: currentFrame });
    }
  }

  adapt(underran) {
    const now = currentFrame;
    if (underran) {
      this.target = Math.min(this.maxFrames, this.target + 512);
      this.holdUntil = now + 10 * sampleRate;
      this.windowStart = now;
      this.windowLow = Infinity;
      return;
    }
    if (this.queued < this.windowLow) this.windowLow = this.queued;
    if (now - this.windowStart >= 2 * sampleRate) {
      if (now >= this.holdUntil && this.windowLow > 512 && this.target > this.minFrames) {
        this.target = Math.max(this.minFrames, this.target - BLOCK);
      }
      this.windowStart = now;
      this.windowLow = Infinity;
    }
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const ch = this.channels;
    const frames = out[0].length;
    let i = 0;
    while (i < frames && this.queue.length) {
      const blk = this.queue[0];
      const n = Math.min(frames - i, (blk.length - this.head) / ch);
      for (let k = 0; k < n; k++) {
        for (let c = 0; c < ch; c++) out[c][i + k] = blk[this.head + k * ch + c] / 32768;
      }
      i += n;
      this.head += n * ch;
      this.queued -= n;
      if (this.head >= blk.length) { this.queue.shift(); this.head = 0; }
    }
    let underran = false;
    if (i < frames) {
      for (let c = 0; c < out.length; c++) out[c].fill(0, i);
      if (this.started) {
        underran = true;
        this.underruns++;
        if (this.worker) this.worker.postMessage({ underrun: 1 });
      }
    } else {
      this.started = true;
    }
    this.played += i;
    if (this.started) {
      const offset = currentFrame + frames - this.played;
      if (offset !== this.offset && this.worker) {
        this.offset = offset;
        this.worker.postMessage({ offset });
      }
      if (this.queued < this.low) this.low = this.queued;
      this.adapt(underran);
    }
    if (this.tap) this.record(out, frames);
    this.ask();
    return true;
  }

  record(out, frames) {
    if (this.tapAt === 0) this.tapStart = currentFrame;
    const ch = this.channels;
    for (let k = 0; k < frames; k++) {
      for (let c = 0; c < ch; c++) this.tap[(this.tapAt + k) * ch + c] = out[c][k];
    }
    this.tapAt += frames;
    if ((this.tapAt + frames) * ch > this.tap.length) {
      const chunk = this.tap.slice(0, this.tapAt * ch);
      this.port.postMessage({ type: "tap", start: this.tapStart, channels: ch, pcm: chunk }, [chunk.buffer]);
      this.tapAt = 0;
    }
  }
}

registerProcessor("python-worker-output", PythonWorkerOutput);
