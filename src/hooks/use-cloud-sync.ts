import { useEffect, useState } from "react";
import { getFirebaseAccountServices } from "../data/firebase-account";
import {
  applySyncedStorage,
  readSyncedStorage,
  SYNCED_STORAGE_EVENT,
} from "../data/synced-storage";

type CloudState = { version?: number; updatedAt?: number; items?: Record<string, string> };

export function useCloudSync() {
  const enabled =
    !import.meta.env["VITEST"] &&
    Boolean(
      import.meta.env["VITE_FIREBASE_API_KEY"] &&
      import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] &&
      import.meta.env["VITE_FIREBASE_PROJECT_ID"],
    );
  const [state, setState] = useState<{
    ready: boolean;
    revision: number;
    authenticated?: boolean;
    enabled: boolean;
  }>({ ready: !enabled, revision: 0, enabled });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let stopAuth: (() => void) | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let uploadTimer: ReturnType<typeof setTimeout> | undefined;
    let saveCloud: (() => Promise<void>) | undefined;

    function scheduleUpload() {
      if (!saveCloud) return;
      clearTimeout(uploadTimer);
      uploadTimer = setTimeout(() => void saveCloud?.(), 350);
    }
    window.addEventListener(SYNCED_STORAGE_EVENT, scheduleUpload);

    void getFirebaseAccountServices()
      .then(({ auth, authApi, databaseURL }) => {
        if (!active) return;
        async function syncUser(user: (typeof auth)["currentUser"]) {
          clearInterval(pollTimer);
          pollTimer = undefined;
          saveCloud = undefined;
          if (!user) {
            setState((current) => ({ ...current, ready: true, authenticated: false }));
            return;
          }

          setState((current) => ({ ...current, ready: false }));
          const url = `${databaseURL}/users/${user.uid}/state.json`;
          const request = async (method: "GET" | "PUT", body?: CloudState) => {
            const token = await user.getIdToken();
            const init: RequestInit = { method };
            if (body) {
              init.body = JSON.stringify(body);
              init.headers = { "Content-Type": "application/json" };
            }
            const response = await fetch(`${url}?auth=${encodeURIComponent(token)}`, init);
            if (!response.ok) throw new Error("sync");
            return (await response.json()) as CloudState | null;
          };
          const cloud = await request("GET");
          if (!active) return;

          let lastItems = "";
          if (cloud?.items) {
            applySyncedStorage(cloud.items);
            lastItems = JSON.stringify(cloud.items);
          } else {
            const items = readSyncedStorage();
            lastItems = JSON.stringify(items);
            await request("PUT", {
              version: 1,
              updatedAt: Date.now(),
              items,
            });
          }

          saveCloud = async () => {
            const items = readSyncedStorage();
            const serialized = JSON.stringify(items);
            if (serialized === lastItems) return;
            lastItems = serialized;
            await request("PUT", {
              version: 1,
              updatedAt: Date.now(),
              items,
            });
          };

          setState((current) => ({
            ...current,
            ready: true,
            authenticated: true,
            revision: current.revision + 1,
          }));
          pollTimer = setInterval(() => {
            void request("GET")
              .then((next) => {
                if (!next?.items) return;
                const serialized = JSON.stringify(next.items);
                if (serialized === lastItems) return;
                lastItems = serialized;
                applySyncedStorage(next.items);
                setState((current) => ({
                  ...current,
                  ready: true,
                  authenticated: true,
                  revision: current.revision + 1,
                }));
              })
              .catch(() => undefined);
          }, 5000);
        }
        stopAuth = authApi.onAuthStateChanged(auth, (user) => {
          void syncUser(user).catch(() => setState((current) => ({ ...current, ready: true })));
        });
      })
      .catch(() => setState((current) => ({ ...current, ready: true })));

    return () => {
      active = false;
      clearTimeout(uploadTimer);
      clearInterval(pollTimer);
      stopAuth?.();
      window.removeEventListener(SYNCED_STORAGE_EVENT, scheduleUpload);
    };
  }, [enabled]);

  return state;
}
