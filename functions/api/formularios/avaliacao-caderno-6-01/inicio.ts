import { enforceRateLimit } from "../../../_lib/db";
import {
  jsonResponse,
  requireRuntimeConfiguration,
  toErrorResponse,
} from "../../../_lib/http";
import { issueFormToken } from "../../../_lib/security";
import type { FunctionContext } from "../../../_lib/types";

export async function onRequestGet(context: FunctionContext) {
  try {
    requireRuntimeConfiguration(context.env, [
      "FORM_DB",
      "RATE_LIMIT_SECRET",
      "FORM_TOKEN_SECRET",
    ]);
    await enforceRateLimit(context, "form_start", 180, 10 * 60);
    const formToken = await issueFormToken(context.env.FORM_TOKEN_SECRET!);
    return jsonResponse({ ok: true, formToken });
  } catch (error) {
    return toErrorResponse(
      error,
      "Não foi possível iniciar o formulário.",
    );
  }
}
