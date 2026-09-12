import {
  createFirebasePublicRoomPublisher,
  createFirebaseRealtimeStore,
  firebasePublicStreamUrl,
} from "../src/backend/firebase-realtime-store.js";
import { createLocalRoomHandler } from "../src/backend/local-room-handler.js";
import { createVercelHandler } from "../src/backend/vercel-adapter.js";

const config = {
  databaseUrl: process.env["FIREBASE_DATABASE_URL"] ?? "",
  serviceAccount: {
    clientEmail: process.env["FIREBASE_CLIENT_EMAIL"] ?? "",
    // No painel da Vercel, a chave é colada como uma única linha com "\n"
    // literais; o Realtime Database exige quebras de linha de verdade.
    privateKey: (process.env["FIREBASE_PRIVATE_KEY"] ?? "").replace(/\\n/g, "\n"),
  },
};

const handler = createLocalRoomHandler({
  store: createFirebaseRealtimeStore(config),
  publish: createFirebasePublicRoomPublisher(config),
  streamUrl: (code) => firebasePublicStreamUrl(config, code),
});

export default createVercelHandler("/api/local-room", handler);
