import type { ToolId } from "../tools/registry";
export class Sound {
  private context?: AudioContext;
  play(id: ToolId): void {
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      const frequency = {
        hammer: 150,
        pillow: 95,
        tomato: 220,
        water: 530,
        boot: 120,
        lightning: 740,
      }[id];
      oscillator.type = id === "lightning" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, frequency / 4),
        ctx.currentTime + 0.16,
      );
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.21);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      /* Audio is optional when unsupported. */
    }
  }
  mute(): void {
    if (this.context?.state === "running")
      void this.context.suspend().catch(() => {});
  }
}
