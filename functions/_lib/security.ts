import { EVALUATION_FORM } from "../../shared/form-definition";
import { HttpError } from "./http";

const encoder = new TextEncoder();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g;

type EvaluationPayload = {
  submissionKey: string;
  formToken: string;
  fullName: string;
  turma: typeof EVALUATION_FORM.turma;
  answers: string[];
  comments: string;
  website: string;
};

export type AdminFilters = {
  busca: string;
  turma: "" | typeof EVALUATION_FORM.turma;
  data: string;
  ordenacao: "data_desc" | "data_asc" | "nome_asc" | "nome_desc";
  pagina: number;
  limite: 10 | 25 | 50 | 100;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
) {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new HttpError(
      400,
      "unexpected_field",
      "Os dados enviados contêm campos não reconhecidos.",
    );
  }
}

function sanitizeSingleLine(value: string) {
  return value
    .normalize("NFC")
    .replace(/\r?\n|\r/g, " ")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeMultiline(value: string) {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function requiredString(
  value: unknown,
  label: string,
  minLength: number,
  maxLength: number,
  multiline = false,
) {
  if (typeof value !== "string") {
    throw new HttpError(
      400,
      "invalid_field",
      `O campo “${label}” é inválido.`,
    );
  }

  const sanitized = multiline
    ? sanitizeMultiline(value)
    : sanitizeSingleLine(value);

  if (
    sanitized.length < minLength ||
    sanitized.length > maxLength
  ) {
    throw new HttpError(
      400,
      "invalid_field",
      `Revise o campo “${label}”.`,
    );
  }

  return sanitized;
}

function optionalString(
  value: unknown,
  label: string,
  maxLength: number,
  multiline = false,
) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return requiredString(value, label, 0, maxLength, multiline);
}

export function validateSubmissionKey(value: unknown) {
  const submissionKey = requiredString(
    value,
    "chave da submissão",
    36,
    36,
  );
  if (!UUID_PATTERN.test(submissionKey)) {
    throw new HttpError(
      400,
      "invalid_submission_key",
      "A chave da submissão é inválida.",
    );
  }
  return submissionKey;
}

export function validateEvaluationPayload(value: unknown): EvaluationPayload {
  if (!isRecord(value)) {
    throw new HttpError(
      400,
      "invalid_payload",
      "Os dados enviados são inválidos.",
    );
  }

  assertOnlyKeys(value, [
    "submissionKey",
    "formToken",
    "startedAt",
    "fullName",
    "turma",
    "answers",
    "comments",
    "website",
  ]);

  const submissionKey = validateSubmissionKey(value.submissionKey);

  const formToken = requiredString(
    value.formToken,
    "token do formulário",
    20,
    4096,
  );
  const fullName = requiredString(
    value.fullName,
    "Nome completo",
    3,
    120,
  );
  const turma = requiredString(value.turma, "Turma", 3, 40);

  if (turma !== EVALUATION_FORM.turma) {
    throw new HttpError(400, "invalid_class", "A turma informada é inválida.");
  }

  if (!Array.isArray(value.answers) || value.answers.length !== 10) {
    throw new HttpError(
      400,
      "invalid_answers",
      "Responda às dez questões antes de enviar.",
    );
  }

  const answers = value.answers.map((answer, index) =>
    requiredString(answer, `Questão ${index + 1}`, 1, 2000, true),
  );

  return {
    submissionKey,
    formToken,
    fullName,
    turma: EVALUATION_FORM.turma,
    answers,
    comments: optionalString(
      value.comments,
      "Comentários",
      2000,
      true,
    ),
    website: optionalString(value.website, "website", 200),
  };
}

export function canonicalEvaluationPayload(payload: EvaluationPayload) {
  return JSON.stringify({
    formSlug: EVALUATION_FORM.slug,
    fullName: payload.fullName,
    turma: payload.turma,
    answers: payload.answers,
    comments: payload.comments,
  });
}

export function validateAdminFilters(value: unknown): AdminFilters {
  if (!isRecord(value)) {
    throw new HttpError(
      400,
      "invalid_filters",
      "Os filtros informados são inválidos.",
    );
  }

  assertOnlyKeys(value, [
    "busca",
    "turma",
    "data",
    "ordenacao",
    "pagina",
    "limite",
  ]);

  const busca = optionalString(value.busca, "busca", 120);
  const turma = optionalString(value.turma, "turma", 40);
  if (turma && turma !== EVALUATION_FORM.turma) {
    throw new HttpError(400, "invalid_class", "A turma informada é inválida.");
  }

  const data = optionalString(value.data, "data", 10);
  if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new HttpError(400, "invalid_date", "A data informada é inválida.");
  }

  const ordenacao =
    typeof value.ordenacao === "string" ? value.ordenacao : "data_desc";
  if (
    !["data_desc", "data_asc", "nome_asc", "nome_desc"].includes(
      ordenacao,
    )
  ) {
    throw new HttpError(
      400,
      "invalid_sort",
      "A ordenação informada é inválida.",
    );
  }

  const pagina = value.pagina === undefined ? 1 : Number(value.pagina);
  const limite = value.limite === undefined ? 10 : Number(value.limite);
  if (!Number.isInteger(pagina) || pagina < 1) {
    throw new HttpError(400, "invalid_page", "A página informada é inválida.");
  }
  if (![10, 25, 50, 100].includes(limite)) {
    throw new HttpError(
      400,
      "invalid_page_size",
      "A quantidade por página é inválida.",
    );
  }

  return {
    busca,
    turma: turma as AdminFilters["turma"],
    data,
    ordenacao: ordenacao as AdminFilters["ordenacao"],
    pagina,
    limite: limite as AdminFilters["limite"],
  };
}

export function validateLoginPayload(value: unknown) {
  if (!isRecord(value)) {
    throw new HttpError(
      400,
      "invalid_login",
      "As credenciais informadas são inválidas.",
    );
  }

  assertOnlyKeys(value, ["email", "password", "website"]);

  if (
    typeof value.password !== "string" ||
    value.password.length < 1 ||
    value.password.length > 512
  ) {
    throw new HttpError(
      400,
      "invalid_login",
      "As credenciais informadas são inválidas.",
    );
  }

  return {
    email: requiredString(value.email, "E-mail", 3, 254).toLowerCase(),
    password: value.password,
    website: optionalString(value.website, "website", 200),
  };
}

export function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function hmacBytes(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

export async function hmacBase64Url(secret: string, value: string) {
  return bytesToBase64Url(await hmacBytes(secret, value));
}

export async function hmacHex(secret: string, value: string) {
  const signature = await hmacBytes(secret, value);
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function constantTimeEqual(
  left: Uint8Array,
  right: Uint8Array,
) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function issueFormToken(secret: string, now = Date.now()) {
  const payload = {
    slug: EVALUATION_FORM.slug,
    nonce: crypto.randomUUID(),
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 2 * 60 * 60,
  };
  const encodedPayload = bytesToBase64Url(
    encoder.encode(JSON.stringify(payload)),
  );
  const signature = await hmacBase64Url(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyFormToken(
  token: string,
  secret: string,
  now = Date.now(),
) {
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) {
    throw new HttpError(
      400,
      "invalid_form_token",
      "Atualize a página e tente novamente.",
    );
  }

  const expected = await hmacBytes(secret, encodedPayload);
  let provided: Uint8Array;
  try {
    provided = base64UrlToBytes(signature);
  } catch {
    throw new HttpError(
      400,
      "invalid_form_token",
      "Atualize a página e tente novamente.",
    );
  }

  if (!constantTimeEqual(expected, provided)) {
    throw new HttpError(
      400,
      "invalid_form_token",
      "Atualize a página e tente novamente.",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    );
  } catch {
    throw new HttpError(
      400,
      "invalid_form_token",
      "Atualize a página e tente novamente.",
    );
  }

  if (!isRecord(payload)) {
    throw new HttpError(
      400,
      "invalid_form_token",
      "Atualize a página e tente novamente.",
    );
  }

  const nowSeconds = Math.floor(now / 1000);
  if (
    payload.slug !== EVALUATION_FORM.slug ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    payload.iat > nowSeconds - 3 ||
    payload.exp < nowSeconds
  ) {
    throw new HttpError(
      400,
      "invalid_form_token",
      "Aguarde alguns segundos ou atualize a página antes de enviar.",
    );
  }
}

export function neutralizeSpreadsheetFormula(value: string) {
  return /^[\u0009\u000d\u0020]*[=+\-@]/.test(value)
    ? `'${value}`
    : value;
}
