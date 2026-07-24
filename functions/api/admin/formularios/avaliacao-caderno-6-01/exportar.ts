import { RESPONSE_HEADERS } from "../../../../../shared/form-definition";
import { requireAdminSession } from "../../../../_lib/auth";
import { enforceRateLimit } from "../../../../_lib/db";
import {
  createCsv,
  createXlsx,
  downloadResponse,
} from "../../../../_lib/export";
import { readResponseRows } from "../../../../_lib/google-sheets";
import {
  HttpError,
  requireRuntimeConfiguration,
  toErrorResponse,
} from "../../../../_lib/http";
import type { FunctionContext } from "../../../../_lib/types";

const FILE_BASENAME =
  "avaliacao-caderno-6ano01-2trimestre-2025";

export async function onRequestGet(context: FunctionContext) {
  try {
    requireRuntimeConfiguration(context.env, [
      "FORM_DB",
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SPREADSHEET_ID",
      "RATE_LIMIT_SECRET",
      "ADMIN_SESSION_SECRET",
    ]);
    const fetchSite = context.request.headers.get("Sec-Fetch-Site");
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      throw new HttpError(
        403,
        "invalid_request_source",
        "Não foi possível validar a solicitação.",
      );
    }
    await requireAdminSession(context.request, context.env);
    await enforceRateLimit(context, "admin_export", 30, 10 * 60);

    const formato = new URL(context.request.url).searchParams.get("formato");
    if (formato !== "csv" && formato !== "xlsx") {
      throw new HttpError(
        400,
        "invalid_export_format",
        "Escolha o formato CSV ou XLSX.",
      );
    }

    const responseRows = await readResponseRows(context.env);
    const rows = [
      [...RESPONSE_HEADERS],
      ...responseRows.map((row) => [...row]),
    ];

    if (formato === "csv") {
      return downloadResponse(
        createCsv(rows),
        "text/csv; charset=utf-8",
        `${FILE_BASENAME}.csv`,
      );
    }
    return downloadResponse(
      createXlsx(rows),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      `${FILE_BASENAME}.xlsx`,
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "Não foi possível gerar o arquivo solicitado.",
    );
  }
}
