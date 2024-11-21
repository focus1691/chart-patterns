export const isWithinTimeWindow = (window: { start: number; end: number }, timestamp: number): boolean => {
  const dateFromTimestamp = new Date(timestamp);

  const utcHour = dateFromTimestamp.getUTCHours();
  const utcMinutes = dateFromTimestamp.getUTCMinutes();
  const utcSeconds = dateFromTimestamp.getUTCSeconds();

  if (window.start === window.end) {
    return utcHour === window.start && utcMinutes === 0 && utcSeconds === 0;
  } else {
    return utcHour >= window.start && utcHour <= window.end;
  }
};
