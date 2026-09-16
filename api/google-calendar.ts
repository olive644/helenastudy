import { createFirebaseRealtimeStore } from "../src/backend/firebase-realtime-store.js";
import { createGoogleCalendarHandler } from "../src/backend/google-calendar-handler.js";
import { createVercelHandler } from "../src/backend/vercel-adapter.js";

const rateLimitStore = createFirebaseRealtimeStore({
  databaseUrl: process.env["FIREBASE_DATABASE_URL"] ?? "",
  serviceAccount: {
    clientEmail: process.env["FIREBASE_CLIENT_EMAIL"] ?? "",
    privateKey: (process.env["FIREBASE_PRIVATE_KEY"] ?? "").replace(/\\n/g, "\n"),
  },
});

const handler = createGoogleCalendarHandler({
  config: {
    clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
    redirectUri: process.env["GOOGLE_REDIRECT_URI"] ?? "",
  },
  sessionSecret: process.env["GOOGLE_SESSION_SECRET"] ?? "",
  appUrl(request) {
    return new URL(request.url).origin;
  },
  rateLimitStore,
  clientId(request) {
    return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  },
});

export default createVercelHandler("/api/google-calendar", handler);
