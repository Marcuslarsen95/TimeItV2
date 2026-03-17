type Unit = "Seconds" | "Minutes" | "Hours";

const pad = (num: number, length: number) => {
  let string = num.toString();
  while (string.length < length) string = "0" + string;
  return string;
};

export const formatDateTimer = (totalMills: number, showMills: boolean) => {
  const safeMs = Math.max(0, showMills ? totalMills : totalMills + 1000); // ← prevents negative values

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
