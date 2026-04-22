import { WorkoutPreset } from "@/hooks/use-workout-presets";
type Unit = "Seconds" | "Minutes" | "Hours";

const pad = (num: number, length: number) => {
  let string = num.toString();
  while (string.length < length) string = "0" + string;
  return string;
};

export const formatDateTimer = (totalMills: number, showMills: boolean) => {
  const safeMs = Math.max(0, totalMills);

  const totalSeconds = Math.floor(safeMs / 1000); // floor, not ceil
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  const main = `${pad(minutes, 2)}:${pad(seconds, 2)}`;
  const ms = showMills ? `:${pad(centiseconds, 2)}` : "";
  return { main, ms };
};

export const getTimerFontSize = (totalMs: number): number => {
  // if (totalMs < 10_000) return 60; // < 10s → very large
  if (totalMs < 60_000) return 60; // < 1m → large
  if (totalMs < 5 * 60_000) return 48; // < 5m → medium
  return 36; // otherwise → small
};

export const convertToMs = (value: number, unit: Unit) => {
  switch (unit) {
    case "Seconds":
      return value * 1000;

    case "Minutes":
      return value * 60 * 1000;

    case "Hours":
      return value * 60 * 60 * 1000;

    default:
      return value * 1000;
  }
};

export const getRandomMs = (minMs: number, maxMs: number) => {
  const min = Math.ceil(minMs);
  const max = Math.floor(maxMs);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// export const formatShort = (secs: number) => {
//   if (secs >= 60)
//     return `${Math.floor(secs / 60)}m ${secs % 60 > 0 ? `${secs % 60}s` : ""}`.trim();
//   return `${secs}s`;
// };

const formatShort = (secs: number) => {
  if (!secs || secs <= 0) return "0s";

  // Force everything to integers immediately
  const totalSeconds = Math.floor(secs);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);

  // Check against the floored integer
  if (s > 0 || parts.length === 0) {
    parts.push(`${s}s`);
  }

  return parts.join(" ");
};

export function summarizePreset(preset: WorkoutPreset): string {
  switch (preset.type) {
    case "countdown":
      return formatShort(preset.config.duration ?? 0);

    case "interval": {
      const segs = preset.config.segments ?? [];
      const active = segs.filter((s) => s.durationSecs > 0);
      if (active.length === 0) return "No intervals";
      return active
        .map((s) => `${s.name} ${formatShort(s.durationSecs)}`)
        .join(" · ");
    }

    case "random": {
      const min = formatShort(preset.config.minSecs ?? 0);
      const max = formatShort(preset.config.maxSecs ?? 0);
      return `${min} – ${max}`;
    }
  }
}
