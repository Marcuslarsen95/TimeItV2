const pad = (num: number, length: number) => {
  let string = num.toString();
  while (string.length < length) string = "0" + string;
  return string;
};

export const formatDateTimer = (totalMills: number): string => {
  const hours = Math.floor(totalMills / 3600000);
  const minutes = Math.floor((totalMills % 3600000) / 60000);
  const seconds = Math.floor((totalMills % 60000) / 1000);
  const mills = Math.floor((totalMills % 1000) / 10);

  const showMs = totalMills < 10000; // < 10 seconds

  let parts: string[] = [];

  if (hours > 0) {
    // Show hours, minutes, seconds
    parts.push(pad(hours, 2));
    parts.push(pad(minutes, 2));
    parts.push(pad(seconds, 2));
  } else if (minutes > 0) {
    // Show minutes, seconds, AND hours as 00
    parts.push("00");
    parts.push(pad(minutes, 2));
    parts.push(pad(seconds, 2));
  } else {
    // Only seconds left → show hours and minutes as 00
    parts.push("00");
    parts.push("00");
    parts.push(pad(seconds, 2));
  }

  let output = parts.join(":");

  if (showMs) {
    output += `:${pad(mills, 2)}`;
  }

  return output;
};
