import { HttpError } from "./http";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  constantTimeEqual,
  hmacBase64Url,
  hmacBytes,
  hmacHex,
} from "./security";
import type { RuntimeEnv } from "./types";

const SESSION_COOKIE = "__Host-lunario_admin";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

export type AdminSession = {
  email: string;
  expiresAt: number;
  rawToken: string;
};

function requireAuthConfiguration(env: RuntimeEnv) {
  if (!env.FORM_DB || !env.ADMIN_SESSION_SECRET) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }
  return {
    database: env.FORM_DB,
    secret: env.ADMIN_SESSION_SECRET,
  };
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return "";
}

function createRandomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function sessionCookie(rawToken: string) {
  return [
    `${SESSION_COOKIE}=${rawToken}`,
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

export function expiredSessionCookie() {
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

export async function createAdminSession(env: RuntimeEnv, email: string) {
  const { database, secret } = requireAuthConfiguration(env);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_DURATION_SECONDS;
  const rawToken = createRandomToken();
  const tokenHash = await hmacHex(secret, `session:${rawToken}`);

  await database
    .prepare(
      `INSERT INTO admin_sessions (
        token_hash,
        email,
        created_at,
        expires_at,
        revoked_at
      ) VALUES (?, ?, ?, ?, NULL)`,
    )
    .bind(tokenHash, email, now, expiresAt)
    .run();

  return { email, expiresAt, rawToken };
}

export async function getAdminSession(
  request: Request,
  env: RuntimeEnv,
): Promise<AdminSession | null> {
  const { database, secret } = requireAuthConfiguration(env);
  const rawToken = readCookie(request, SESSION_COOKIE);
  if (!rawToken || rawToken.length > 256) {
    return null;
  }

  const tokenHash = await hmacHex(secret, `session:${rawToken}`);
  const now = Math.floor(Date.now() / 1000);
  const row = await database
    .prepare(
      `SELECT email, expires_at
      FROM admin_sessions
      WHERE token_hash = ?
        AND revoked_at IS NULL
        AND expires_at > ?`,
    )
    .bind(tokenHash, now)
    .first<{ email: string; expires_at: number }>();

  if (!row) {
    return null;
  }

  return {
    email: String(row.email),
    expiresAt: Number(row.expires_at),
    rawToken,
  };
}

export async function requireAdminSession(
  request: Request,
  env: RuntimeEnv,
) {
  const session = await getAdminSession(request, env);
  if (!session) {
    throw new HttpError(
      401,
      "authentication_required",
      "É necessário entrar como administrador.",
    );
  }
  return session;
}

export async function revokeAdminSession(
  request: Request,
  env: RuntimeEnv,
) {
  const { database, secret } = requireAuthConfiguration(env);
  const rawToken = readCookie(request, SESSION_COOKIE);
  if (!rawToken) {
    return;
  }
  const tokenHash = await hmacHex(secret, `session:${rawToken}`);
  await database
    .prepare(
      `UPDATE admin_sessions
      SET revoked_at = ?
      WHERE token_hash = ? AND revoked_at IS NULL`,
    )
    .bind(Math.floor(Date.now() / 1000), tokenHash)
    .run();
}

export async function csrfTokenForSession(
  session: AdminSession,
  env: RuntimeEnv,
) {
  if (!env.ADMIN_SESSION_SECRET) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }
  return hmacBase64Url(
    env.ADMIN_SESSION_SECRET,
    `csrf:${session.rawToken}`,
  );
}

export async function requireCsrfToken(
  request: Request,
  session: AdminSession,
  env: RuntimeEnv,
) {
  if (!env.ADMIN_SESSION_SECRET) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }

  const providedValue = request.headers.get("X-CSRF-Token") ?? "";
  let provided: Uint8Array;
  try {
    provided = base64UrlToBytes(providedValue);
  } catch {
    throw new HttpError(
      403,
      "invalid_csrf_token",
      "Não foi possível validar a solicitação.",
    );
  }
  const expected = await hmacBytes(
    env.ADMIN_SESSION_SECRET,
    `csrf:${session.rawToken}`,
  );
  if (!constantTimeEqual(expected, provided)) {
    throw new HttpError(
      403,
      "invalid_csrf_token",
      "Não foi possível validar a solicitação.",
    );
  }
}

export async function verifyAdminPassword(
  password: string,
  encodedHash: string,
) {
  const [algorithm, iterationText, saltText, expectedText, extra] =
    encodedHash.split("$");
  const iterations = Number(iterationText);
  if (
    algorithm !== "pbkdf2-sha256" ||
    extra !== undefined ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 2_000_000
  ) {
    return false;
  }

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = base64UrlToBytes(saltText);
    expected = base64UrlToBytes(expectedText);
  } catch {
    return false;
  }
  if (salt.length < 16 || expected.length !== 32) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: new Uint8Array(salt),
        iterations,
      },
      key,
      256,
    ),
  );

  return constantTimeEqual(derived, expected);
}
