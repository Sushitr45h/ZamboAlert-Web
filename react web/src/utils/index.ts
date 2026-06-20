import { useEffect, useState } from "react";

/** Hook that returns the current time, updating every second */
export function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Format a Date to locale time string (24h, en-PH) */
export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-PH", { hour12: false });
}

/** Format a Date to short locale date string (en-PH) */
export function formatDate(date: Date) {
  return date.toLocaleDateString("en-PH", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
