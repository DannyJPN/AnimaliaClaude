import { createCookieSessionStorage } from "react-router";
import { pziConfig } from "./pzi-config";

export type SessionData = {
  userId: number,
  userName: string,
  roles: string[],
  visibleTaxonomyStatuses: string[],
  taxonomySearchBy: Record<'lat' | 'cz', boolean>,
  permissions: string[]
};

export const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    // Name of the session cookie, use whatever you want here
    name: "session",
    // This configures the cookie so it's not accessible with `document.cookie`
    httpOnly: true,
    // This configures the cookie so it's only sent over HTTPS when running in
    // production. When running locally, it's sent over HTTP too
    secure: pziConfig.NODE_ENV === "production",
    // This configures the path where the cookie will be available, / means
    // everywhere
    path: "/",
    // This secrets are used to sign the cookie, preventing any tampering
    secrets: [pziConfig.SESSION_SECRET],
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

