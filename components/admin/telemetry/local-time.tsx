"use client";

import { useSyncExternalStore } from "react";
import { date } from "@/lib/telemetry";

const subscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverTimeZone = () => "UTC";

export function useLocalTimeZone() {
  // The server snapshot also runs during hydration; then use the browser zone.
  return useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
}

export function LocalTime({ value }: { value: string | number }) {
  const timeZone = useLocalTimeZone();
  return <>{date(value, timeZone)}</>;
}
