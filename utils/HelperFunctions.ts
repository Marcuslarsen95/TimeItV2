type Unit = "Seconds" | "Minutes" | "Hours";

const pad = (num: number, length: number) => {
  let string = num.toString();
  while (string.length < length) string = "0" + string;
  return string;
};

export const formatDateTimer = (totalMills: number, showMills: boolean) => {
  const safeMs = Math.max(0, totalMills);

  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const main = `${pad(minutes, 2)}:${pad(seconds, 2)}`;
  return { main, ms: "" };
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
