import {
  RESPONSE_COLUMN_COUNT,
  RESPONSE_HEADERS,
} from "../../shared/form-definition";
import { HttpError } from "./http";
import { bytesToBase64Url } from "./security";
import type { RuntimeEnv } from "./types";

const SHEET_NAME = "Respostas";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets";
const encoder = new TextEncoder();

let cachedAccessToken:
  | { email: string; token: string; expiresAt: number }
  | undefined;
let validatedSpreadsheetId: string | undefined;

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

type GoogleValuesResponse = {
  values?: unknown[][];
};

class GoogleSheetsResponseError extends HttpError {
  readonly remoteStatus: number;

  constructor(remoteStatus: number) {
    super(
      502,
      "sheets_unavailable",
      "Não foi possível acessar o repositório de respostas.",
    );
    this.remoteStatus = remoteStatus;
  }
}

export type ResponseRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

function requireSheetsConfiguration(env: RuntimeEnv) {
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;

  if (!email || !privateKey || !spreadsheetId) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }

  return { email, privateKey, spreadsheetId };
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function privateKeyBytes(pemValue: string) {
  const normalized = pemValue.replace(/\\n/g, "\n").trim();
  const base64 = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  if (!base64) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }

  try {
    const binary = atob(base64);
    return Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0),
    );
  } catch {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }
}

async function createServiceAccountAssertion(
  email: string,
  privateKey: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const claims = textToBase64Url(
    JSON.stringify({
      iss: email,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedAssertion = `${header}.${claims}`;

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBytes(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsignedAssertion),
  );

  return `${unsignedAssertion}.${bytesToBase64Url(
    new Uint8Array(signature),
  )}`;
}

async function getAccessToken(env: RuntimeEnv) {
  const { email, privateKey } = requireSheetsConfiguration(env);
  const now = Date.now();
  if (
    cachedAccessToken?.email === email &&
    cachedAccessToken.expiresAt > now + 60_000
  ) {
    return cachedAccessToken.token;
  }

  const assertion = await createServiceAccountAssertion(email, privateKey);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new HttpError(
      502,
      "sheets_unavailable",
      "Não foi possível acessar o repositório de respostas.",
    );
  }

  const body = (await response.json()) as GoogleTokenResponse;
  if (!body.access_token) {
    throw new HttpError(
      502,
      "sheets_unavailable",
      "Não foi possível acessar o repositório de respostas.",
    );
  }

  cachedAccessToken = {
    email,
    token: body.access_token,
    expiresAt: now + Math.max(body.expires_in ?? 3600, 60) * 1000,
  };
  return body.access_token;
}

async function sheetsRequest(
  env: RuntimeEnv,
  path: string,
  init?: RequestInit,
) {
  const { spreadsheetId } = requireSheetsConfiguration(env);
  const accessToken = await getAccessToken(env);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...init?.headers,
      },
    },
  );

  if (!response.ok) {
    throw new GoogleSheetsResponseError(response.status);
  }

  return response;
}

async function getValues(env: RuntimeEnv, range: string) {
  const response = await sheetsRequest(
    env,
    `/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
  );
  return (await response.json()) as GoogleValuesResponse;
}

async function ensureExpectedHeaders(env: RuntimeEnv) {
  const { spreadsheetId } = requireSheetsConfiguration(env);
  if (validatedSpreadsheetId === spreadsheetId) {
    return;
  }

  const body = await getValues(env, `${SHEET_NAME}!A1:P1`);
  const header = (body.values?.[0] ?? []).map((value) => String(value));
  if (
    header.length !== RESPONSE_COLUMN_COUNT ||
    RESPONSE_HEADERS.some((expected, index) => header[index] !== expected)
  ) {
    throw new HttpError(
      503,
      "invalid_sheet_structure",
      "O repositório de respostas precisa ser configurado.",
    );
  }

  validatedSpreadsheetId = spreadsheetId;
}

export function isDefiniteSheetsWriteRejection(error: unknown) {
  return (
    error instanceof GoogleSheetsResponseError &&
    error.remoteStatus >= 400 &&
    error.remoteStatus < 500
  );
}

export async function responseIdExists(
  env: RuntimeEnv,
  responseId: string,
) {
  await ensureExpectedHeaders(env);
  const body = await getValues(env, `${SHEET_NAME}!A2:A`);
  return (body.values ?? []).some(
    (row) => String(row[0] ?? "") === responseId,
  );
}

export async function appendResponseRow(
  env: RuntimeEnv,
  row: ResponseRow,
) {
  await ensureExpectedHeaders(env);
  await sheetsRequest(
    env,
    `/values/${encodeURIComponent(
      `${SHEET_NAME}!A:P`,
    )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [row],
      }),
    },
  );
}

export async function readResponseRows(env: RuntimeEnv) {
  await ensureExpectedHeaders(env);
  const body = await getValues(env, `${SHEET_NAME}!A2:P`);
  return (body.values ?? [])
    .map((source) => {
      const values = Array.from(
        { length: RESPONSE_COLUMN_COUNT },
        (_, index) => String(source[index] ?? ""),
      );
      return values as ResponseRow;
    })
    .filter((row) => row.some(Boolean));
}

export function formatSaoPauloTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = value("day");
  const month = value("month");
  const year = value("year");
  const time = `${value("hour")}:${value("minute")}:${value("second")}`;

  return {
    date: `${day}/${month}/${year}`,
    dateIso: `${year}-${month}-${day}`,
    time,
    localIso: `${year}-${month}-${day}T${time}-03:00`,
  };
}
