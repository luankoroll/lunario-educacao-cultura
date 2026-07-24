import {
  csrfTokenForSession,
  requireAdminSession,
} from "../../_lib/auth";
import { jsonResponse, toErrorResponse } from "../../_lib/http";
import type { FunctionContext } from "../../_lib/types";

export async function onRequestGet(context: FunctionContext) {
  try {
    const session = await requireAdminSession(
      context.request,
      context.env,
    );
    const csrfToken = await csrfTokenForSession(session, context.env);
    return jsonResponse({
      ok: true,
      authenticated: true,
      csrfToken,
      expiresAt: new Date(session.expiresAt * 1000).toISOString(),
    });
  } catch (error) {
    return toErrorResponse(error, "Não foi possível validar a sessão.");
  }
}
