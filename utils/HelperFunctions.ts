type Unit = "Seconds" | "Minutes" | "Hours";

const pad = (num: number, length: number) => {
  let string = num.toString();
  while (string.length < length) string = "0" + string;
  return string;
};

export const formatDateTimer = (totalMills: number) => {
  const safeMs = Math.max(0, totalMills); // ← prevents negative values

  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const mills = Math.floor((safeMs % 1000) / 10);

  const showMs = safeMs < 60000;

  let parts: string[] = [];

  if (hours > 0) {
    parts.push(pad(hours, 2), pad(minutes, 2), pad(seconds, 2));
  } else if (minutes > 0) {
    parts.push("00", pad(minutes, 2), pad(seconds, 2));
  } else {
    parts.push("00", pad(seconds, 2));
  }

  const main = parts.join(":");
  const ms = showMs ? ":" + pad(mills, 2) : "";

  return { main, ms };
};
export const getTimerFontSize = (totalMs: number): number => {
  // if (totalMs < 10_000) return 60; // < 10s → very large
  if (totalMs < 60_000) return 60; // < 1m → large
  if (totalMs < 5 * 60_000) return 48; // < 5m → medium
  return 36; // otherwise → small
};

export const lightenColor = (color: string, amount = 0.4) => {
  // If it's an RGB string (which it will be now)
  if (color.startsWith("rgb")) {
    const [r, g, b] = color.match(/\d+/g)!.map(Number);
    const lr = Math.min(255, Math.floor(r + (255 - r) * amount));
    const lg = Math.min(255, Math.floor(g + (255 - g) * amount));
    const lb = Math.min(255, Math.floor(b + (255 - b) * amount));
    return `rgb(${lr}, ${lg}, ${lb})`;
  }

  // Fallback for Hex if needed
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.min(255, Math.floor((num >> 16) * (1 + amount)));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00ff) * (1 + amount)));
  const b = Math.min(255, Math.floor((num & 0x0000ff) * (1 + amount)));
  return `rgb(${r}, ${g}, ${b})`;
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

export const interpolateColor = (t: number, colors: string[]) => {
  // t = 1 → first color, t = 0 → last color
  const clamp = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(colors[0]);
  const [r2, g2, b2] = hexToRgb(colors[1]);

  const r = Math.round(r1 + (r2 - r1) * (1 - clamp));
  const g = Math.round(g1 + (g2 - g1) * (1 - clamp));
  const b = Math.round(b1 + (b2 - b1) * (1 - clamp));

  return `rgb(${r}, ${g}, ${b})`;
};

const mix = (c1: string, c2: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgb = (hex: string) => {
  const num = parseInt(hex.replace("#", ""), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const getUrgencyColor = (remainingMs: number, isPaused: boolean) => {
  const NEUTRAL_GREY = "rgb(158, 158, 158)";
  const GREEN_HEX = "#4CAF50";
  const YELLOW_HEX = "#FFEB3B";
  const RED_HEX = "#F44336";

  // 1. Inactive/Paused State
  if (isPaused || remainingMs <= 0) {
    return NEUTRAL_GREY;
  }

  const s = remainingMs / 1000;

  // 2. Phase 1: 25s down to 15s (Green to Yellow)
  if (s > 15 && s <= 25) {
    // At 25s, t=0 (Green). At 15s, t=1 (Yellow)
    const t = (25 - s) / 10;
    return mix(GREEN_HEX, YELLOW_HEX, t);
  }

  // 3. Phase 2: 15s down to 0s (Yellow to Red)
  if (s <= 15) {
    // At 15s, t=0 (Yellow). At 0s, t=1 (Red)
    const t = (15 - s) / 15;
    return mix(YELLOW_HEX, RED_HEX, t);
  }

  // 4. Above 25s: Solid Green
  return "rgb(76, 175, 80)"; // Matches #4CAF50
};
