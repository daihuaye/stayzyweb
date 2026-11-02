import { number, type Detail, type PianoCheckpoint } from "./telemetry";

export function pianoTimeline(data: Detail) {
  // Older APIs expose v2 state observations and outcomes but omit progress events.
  const source: PianoCheckpoint[] =
    data.piano_checkpoints ??
    [...(data.transitions ?? []), ...(data.outcomes ?? [])].map((event) => ({
      at: Date.parse(event.occurred_at) / 1000,
      sequence: event.sequence,
      run_index: event.run_index,
      seconds: number(event.properties.piano_play_seconds) ?? NaN,
    }));
  const points = source
    .filter(
      (p) =>
        number(p.at) !== null && number(p.seconds) !== null && p.seconds >= 0,
    )
    .sort((a, b) => a.sequence - b.sequence);
  const windows: {
    from: PianoCheckpoint;
    to: PianoCheckpoint;
    seconds: number;
  }[] = [];
  let gaps = 0;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1],
      to = points[i];
    const seconds = to.seconds - from.seconds;
    // Never place cumulative time across a relaunch, counter reset or clock anomaly.
    if (
      to.run_index !== from.run_index ||
      to.at <= from.at ||
      seconds < 0 ||
      seconds > to.at - from.at + 0.05
    ) {
      gaps++;
      continue;
    }
    windows.push({ from, to, seconds });
  }
  return {
    points,
    windows,
    gaps,
    playing: windows.filter((w) => w.seconds > 0),
  };
}
