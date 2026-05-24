import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  isOffline: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismissUpdate: () => void;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Listen for SW update messages
    if ("serviceWorker" in navigator) {
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === "SW_UPDATED") setUpdateAvailable(true);
      };
      navigator.serviceWorker.addEventListener("message", onMessage);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.removeEventListener("appinstalled", onInstalled);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        navigator.serviceWorker.removeEventListener("message", onMessage);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // vite-plugin-pwa's auto-update fires a custom event when a new SW is waiting
  useEffect(() => {
    const onNeedRefresh = () => setUpdateAvailable(true);
    window.addEventListener("vite-plugin-pwa:pwa-update-found", onNeedRefresh);
    return () => window.removeEventListener("vite-plugin-pwa:pwa-update-found", onNeedRefresh);
  }, []);

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!installPrompt) return "unavailable";
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
    return outcome;
  }, [installPrompt]);

  const dismissUpdate = useCallback(() => setUpdateAvailable(false), []);

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    updateAvailable,
    isOffline,
    install,
    dismissUpdate,
  };
}
