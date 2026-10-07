"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const KEY = "garimpo:contacted";
const EVENT = "garimpo:contacted-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback); // other tabs
  window.addEventListener(EVENT, callback); // this tab
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

// The raw string is the snapshot: a primitive, so React can compare it by value.
function getSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]"; // storage blocked (private mode)
  }
}

const getServerSnapshot = () => "[]";

function parse(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Which businesses the user already contacted. Stored only in this browser. */
export function useContacted() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(() => new Set(parse(raw)), [raw]);

  const toggle = useCallback((id: string) => {
    const next = new Set(parse(getSnapshot()));
    if (next.has(id)) next.delete(id);
    else next.add(id);

    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      // Could not persist; nothing else to do.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { contacted: ids, toggle };
}
