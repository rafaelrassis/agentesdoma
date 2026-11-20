import { createHash } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "doma_session";

function sessionToken() {
  const password = process.env.DASHBOARD_PASSWORD ?? "";
  return createHash("sha256").update(`doma-baby:${password}`).digest("hex");
}

export function checkPassword(password: string) {
  return password === (process.env.DASHBOARD_PASSWORD ?? "");
}

export async function createSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function hasValidSession() {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return !!value && value === sessionToken();
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function checkWorkerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.WORKER_TOKEN ?? "";
  return expected.length > 0 && token === expected;
}

export function checkCronSecret(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.CRON_SECRET ?? "";
  return expected.length > 0 && token === expected;
}
