import { queryResponseRows } from "../../../../_lib/admin-responses";
import {
  requireAdminSession,
  requireCsrfToken,
} from "../../../../_lib/auth";
import { enforceRateLimit } from "../../../../_lib/db";
import { readResponseRows } from "../../../../_lib/google-sheets";
import {
  jsonResponse,
  readJsonBody,
  requireJsonContentType,
  requireRuntimeConfiguration,
  requireSameOrigin,
  toErrorResponse,
} from "../../../../_lib/http";
import { validateAdminFilters } from "../../../../_lib/security";
import type { FunctionContext } from "../../../../_lib/types";

export async function onRequestPost(context: FunctionContext) {
  try {
    requireRuntimeConfiguration(context.env, [
      "FORM_DB",
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SPREADSHEET_ID",
      "RATE_LIMIT_SECRET",
      "ADMIN_SESSION_SECRET",
    ]);
    requireSameOrigin(context.request);
    requireJsonContentType(context.request);
    const session = await requireAdminSession(
      context.request,
      context.env,
    );
    await requireCsrfToken(context.request, session, context.env);
    await enforceRateLimit(context, "admin_query", 300, 10 * 60);

    const filters = validateAdminFilters(
      await readJsonBody(context.request, 8 * 1024),
    );
    const rows = await readResponseRows(context.env);
    return jsonResponse({
      ok: true,
      ...queryResponseRows(rows, filters),
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "Não foi possível consultar as respostas.",
    );
  }
}
