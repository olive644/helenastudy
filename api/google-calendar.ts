import { createGoogleCalendarHandler } from "../src/backend/google-calendar-handler.js";
import { createVercelHandler } from "../src/backend/vercel-adapter.js";

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
});

export default createVercelHandler("/api/google-calendar", handler);
