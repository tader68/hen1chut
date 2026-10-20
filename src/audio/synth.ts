import type { ToolId } from "../tools/registry";
export class Sound {
  private context?: AudioContext;
  private noise?: AudioBuffer;
  private voices = new Set<AudioScheduledSourceNode>();
  private output?: GainNode;
  private connectVoice(
    source: AudioScheduledSourceNode,
    filter?: AudioNode,
  ): void {
    this.voices.add(source);
    source.connect(filter || this.output!);
    if (filter) filter.connect(this.output!);
    source.onended = () => {
      source.disconnect();
      filter?.disconnect();
      this.voices.delete(source);
    };
  }
  play(id: ToolId): void {
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      if (!this.output) {
        this.output = ctx.createGain();
        this.output.gain.value = 0.2;
        this.output.connect(ctx.destination);
      }
      if (this.voices.size > 28) return;
      const now = ctx.currentTime,
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      const frequencies: Record<ToolId, [number, number, number]> = {
        hammer: [155, 65, 0.16],
        pillow: [95, 40, 0.18],
        tomato: [275, 70, 0.17],
        water: [610, 180, 0.22],
        boot: [120, 45, 0.16],
        lightning: [780, 110, 0.17],
        boxing: [100, 38, 0.18],
        spring: [150, 580, 0.28],
        slipper: [210, 75, 0.12],
        chicken: [460, 1050, 0.3],
        banana: [650, 110, 0.42],
        confetti: [880, 440, 0.14],
      };
      const [start, end, duration] = frequencies[id];
      osc.type =
        id === "chicken" || id === "spring"
          ? "triangle"
          : id === "lightning"
            ? "sawtooth"
            : "sine";
      osc.frequency.setValueAtTime(start, now);
      osc.frequency.exponentialRampToValueAtTime(end, now + duration);
      if (id === "chicken") {
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.4);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(
        id === "lightning" ? 0.25 : 0.65,
        now + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + duration + (id === "chicken" ? 0.14 : 0.03),
      );
      this.connectVoice(osc, gain);
      osc.start(now);
      osc.stop(now + duration + 0.16);
      if (
        ["pillow", "tomato", "water", "boxing", "slipper", "confetti"].includes(
          id,
        )
      ) {
        if (!this.noise) {
          this.noise = ctx.createBuffer(
            1,
            Math.ceil(ctx.sampleRate * 0.3),
            ctx.sampleRate,
          );
          const data = this.noise.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource(),
          filter = ctx.createBiquadFilter(),
          envelope = ctx.createGain();
        source.buffer = this.noise;
        filter.type = id === "confetti" ? "highpass" : "lowpass";
        filter.frequency.value =
          id === "water"
            ? 2300
            : id === "pillow"
              ? 400
              : id === "confetti"
                ? 3000
                : 1100;
        envelope.gain.setValueAtTime(id === "pillow" ? 0.09 : 0.2, now);
        envelope.gain.exponentialRampToValueAtTime(
          0.001,
          now + (id === "pillow" ? 0.23 : 0.13),
        );
        this.voices.add(source);
        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.output);
        source.start(now);
        source.stop(now + 0.28);
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          envelope.disconnect();
          this.voices.delete(source);
        };
      }
    } catch {
      /* Optional audio never blocks a round. */
    }
  }
  mute(): void {
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {}
      voice.disconnect();
    }
    this.voices.clear();
    if (this.context?.state === "running")
      void this.context.suspend().catch(() => {});
  }
}
