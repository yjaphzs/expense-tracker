"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "expense_tracker_install_dismissed";
const VISITS_KEY = "expense_tracker_visits";
const COUNTED_KEY = "expense_tracker_visit_counted";

function safely<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}

/** Counts this visit (once per browser session) and returns the total. */
function countVisit(): number {
  return safely(() => {
    const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0");
    if (sessionStorage.getItem(COUNTED_KEY)) return visits;
    sessionStorage.setItem(COUNTED_KEY, "1");
    localStorage.setItem(VISITS_KEY, String(visits + 1));
    return visits + 1;
  }, 1);
}

/**
 * Offers to install the app from the second visit on, unless it's installed or
 * the user said "Not now". Chrome, Edge and Android use the browser's prompt;
 * iOS Safari has none, so the banner explains Share → Add to Home Screen.
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const dismissed = safely(() => localStorage.getItem(DISMISSED_KEY) === "1", false);
    if (standalone || dismissed) return;
    const returning = countVisit() >= 2;

    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)) {
      setIos(true);
      setVisible(returning);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(returning);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    safely(() => localStorage.setItem(DISMISSED_KEY, "1"), undefined);
    setVisible(false);
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    if (outcome === "dismissed") dismiss();
    else setVisible(false);
  };

  return { visible, ios: ios && !promptEvent, canPrompt: !!promptEvent, install, dismiss };
}
