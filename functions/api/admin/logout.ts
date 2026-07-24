import {
  expiredSessionCookie,
  requireAdminSession,
  requireCsrfToken,
  revokeAdminSession,
} from "../../_lib/auth";
import {
  jsonResponse,
  requireSameOrigin,
  toErrorResponse,
} from "../../_lib/http";
import type { FunctionContext } from "../../_lib/types";

export async function onRequestPost(context: FunctionContext) {
  try {
    requireSameOrigin(context.request);
    const session = await requireAdminSession(
      context.request,
      context.env,
    );
    await requireCsrfToken(context.request, session, context.env);
    await revokeAdminSession(context.request, context.env);
    return jsonResponse(
      { ok: true, authenticated: false },
      200,
      { "Set-Cookie": expiredSessionCookie() },
    );
  } catch (error) {
    return toErrorResponse(error, "Não foi possível encerrar a sessão.");
  }
}
