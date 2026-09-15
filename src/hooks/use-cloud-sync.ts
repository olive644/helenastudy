import { useEffect, useState } from "react";
import { getFirebaseAccountServices } from "../data/firebase-account";
import {
  applySyncedStorage,
  readSyncedStorage,
  SYNCED_STORAGE_EVENT,
} from "../data/synced-storage";

type CloudState = { items?: Record<string, string> };

export function useCloudSync() {
  const enabled =
    import.meta.env.MODE !== "test" &&
    Boolean(
      import.meta.env["VITE_FIREBASE_API_KEY"] &&
      import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] &&
      import.meta.env["VITE_FIREBASE_PROJECT_ID"],
    );
  const [state, setState] = useState({ ready: true, revision: 0 });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let stopAuth: (() => void) | undefined;
    let stopData: (() => void) | undefined;
    let uploadTimer: ReturnType<typeof setTimeout> | undefined;
    let saveCloud: (() => Promise<void>) | undefined;

    function scheduleUpload() {
      if (!saveCloud) return;
      clearTimeout(uploadTimer);
      uploadTimer = setTimeout(() => void saveCloud?.(), 350);
    }
    window.addEventListener(SYNCED_STORAGE_EVENT, scheduleUpload);

    void getFirebaseAccountServices()
      .then(({ auth, authApi, database, databaseApi }) => {
        if (!active) return;
        async function syncUser(user: (typeof auth)["currentUser"]) {
          stopData?.();
          stopData = undefined;
          saveCloud = undefined;
          if (!user) {
            setState((current) => ({ ...current, ready: true }));
            return;
          }

          setState((current) => ({ ...current, ready: false }));
          const accountRef = databaseApi.ref(database, `users/${user.uid}/state`);
          const initial = await databaseApi.get(accountRef);
          if (!active) return;

          let lastItems = "";
          const cloud = initial.val() as CloudState | null;
          if (cloud?.items) {
            applySyncedStorage(cloud.items);
            lastItems = JSON.stringify(cloud.items);
          } else {
            const items = readSyncedStorage();
            lastItems = JSON.stringify(items);
            await databaseApi.set(accountRef, {
              version: 1,
              updatedAt: databaseApi.serverTimestamp(),
              items,
            });
          }

          saveCloud = async () => {
            const items = readSyncedStorage();
            const serialized = JSON.stringify(items);
            if (serialized === lastItems) return;
            lastItems = serialized;
            await databaseApi.set(accountRef, {
              version: 1,
              updatedAt: databaseApi.serverTimestamp(),
              items,
            });
          };

          setState((current) => ({ ready: true, revision: current.revision + 1 }));
          stopData = databaseApi.onValue(accountRef, (snapshot) => {
            const next = snapshot.val() as CloudState | null;
            if (!next?.items) return;
            const serialized = JSON.stringify(next.items);
            if (serialized === lastItems) return;
            lastItems = serialized;
            applySyncedStorage(next.items);
            setState((current) => ({ ready: true, revision: current.revision + 1 }));
          });
        }
        stopAuth = authApi.onAuthStateChanged(auth, (user) => {
          void syncUser(user).catch(() => setState((current) => ({ ...current, ready: true })));
        });
      })
      .catch(() => setState((current) => ({ ...current, ready: true })));

    return () => {
      active = false;
      clearTimeout(uploadTimer);
      stopData?.();
      stopAuth?.();
      window.removeEventListener(SYNCED_STORAGE_EVENT, scheduleUpload);
    };
  }, [enabled]);

  return state;
}
