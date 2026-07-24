import {
  createAdminSession,
  sessionCookie,
  verifyAdminPassword,
} from "../../_lib/auth";
import { enforceRateLimit } from "../../_lib/db";
import {
  HttpError,
  jsonResponse,
  readJsonBody,
  requireJsonContentType,
  requireRuntimeConfiguration,
  requireSameOrigin,
  toErrorResponse,
} from "../../_lib/http";
import { validateLoginPayload } from "../../_lib/security";
import type { FunctionContext } from "../../_lib/types";

export async function onRequestPost(context: FunctionContext) {
  try {
    requireRuntimeConfiguration(context.env, [
      "FORM_DB",
      "RATE_LIMIT_SECRET",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD_HASH",
      "ADMIN_SESSION_SECRET",
    ]);
    requireSameOrigin(context.request);
    requireJsonContentType(context.request);
    await enforceRateLimit(context, "admin_login", 5, 15 * 60);

    const credentials = validateLoginPayload(
      await readJsonBody(context.request, 8 * 1024),
    );
    const passwordMatches = await verifyAdminPassword(
      credentials.password,
      context.env.ADMIN_PASSWORD_HASH!,
    );
    const emailMatches =
      credentials.email === context.env.ADMIN_EMAIL!.trim().toLowerCase();

    if (credentials.website || !passwordMatches || !emailMatches) {
      throw new HttpError(
        401,
        "invalid_credentials",
        "E-mail ou senha inválidos.",
      );
    }

    const session = await createAdminSession(
      context.env,
      credentials.email,
    );
    return jsonResponse(
      { ok: true, authenticated: true },
      200,
      { "Set-Cookie": sessionCookie(session.rawToken) },
    );
  } catch (error) {
    return toErrorResponse(error, "Não foi possível entrar.");
  }
}
