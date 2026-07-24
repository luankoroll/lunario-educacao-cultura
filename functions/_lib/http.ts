import type { RuntimeEnv } from "./types";

const API_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
) {
  const headers = new Headers(API_HEADERS);
  headers.set("Content-Type", "application/json; charset=utf-8");

  if (extraHeaders) {
    new Headers(extraHeaders).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return new Response(JSON.stringify(body), { status, headers });
}

export function privatePageHeaders(response: Response) {
  const next = new Response(response.body, response);
  next.headers.set("Cache-Control", "private, no-store");
  next.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  next.headers.set("Pragma", "no-cache");
  next.headers.set("Referrer-Policy", "no-referrer");
  next.headers.set("Vary", "Cookie");
  next.headers.set("X-Content-Type-Options", "nosniff");
  next.headers.set("X-Frame-Options", "DENY");
  next.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return next;
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  const requestOrigin = new URL(request.url).origin;

  if (!origin || origin !== requestOrigin) {
    throw new HttpError(
      403,
      "invalid_origin",
      "Não foi possível validar a origem da solicitação.",
    );
  }
}

export function requireJsonContentType(request: Request) {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(
      415,
      "unsupported_media_type",
      "Envie os dados no formato JSON.",
    );
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes = 32 * 1024,
): Promise<unknown> {
  if (!request.body) {
    throw new HttpError(400, "empty_body", "O corpo da solicitação está vazio.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new HttpError(
        413,
        "payload_too_large",
        "Os dados enviados excedem o limite permitido.",
      );
    }
    chunks.push(value);
  }

  const payload = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    payload.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(payload));
  } catch {
    throw new HttpError(
      400,
      "malformed_json",
      "Os dados enviados estão malformados.",
    );
  }
}

export function getClientIp(request: Request) {
  return request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
}

export function requireRuntimeConfiguration(
  env: RuntimeEnv,
  keys: (keyof RuntimeEnv)[],
) {
  for (const key of keys) {
    if (!env[key]) {
      throw new HttpError(
        503,
        "service_unavailable",
        "O serviço está temporariamente indisponível.",
      );
    }
  }
}

export function toErrorResponse(
  error: unknown,
  fallbackMessage = "Não foi possível concluir a solicitação.",
) {
  if (error instanceof HttpError) {
    return jsonResponse(
      { ok: false, code: error.code, message: error.message },
      error.status,
    );
  }

  return jsonResponse(
    { ok: false, code: "internal_error", message: fallbackMessage },
    500,
  );
}

export function methodNotAllowed(methods: string[]) {
  return jsonResponse(
    {
      ok: false,
      code: "method_not_allowed",
      message: "Método não permitido.",
    },
    405,
    { Allow: methods.join(", ") },
  );
}
