import { useSyncExternalStore } from "react";

const USER_ID_KEY = "liber:userId";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getHasSession() {
  return Boolean(window.localStorage.getItem(USER_ID_KEY));
}

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useSessionStatus(): boolean | null {
  const hydrated = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const hasSession = useSyncExternalStore(subscribeToStorage, getHasSession, getServerSnapshot);
  return hydrated ? hasSession : null;
}
