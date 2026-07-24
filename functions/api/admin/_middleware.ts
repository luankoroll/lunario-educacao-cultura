import { requireAdminSession } from "../../_lib/auth";
import {
  privatePageHeaders,
  toErrorResponse,
} from "../../_lib/http";
import type { FunctionContext } from "../../_lib/types";

export async function onRequest(context: FunctionContext) {
  const pathname = new URL(context.request.url).pathname.replace(/\/+$/, "");
  if (pathname === "/api/admin/login") {
    return privatePageHeaders(await context.next());
  }

  try {
    await requireAdminSession(context.request, context.env);
    return privatePageHeaders(await context.next());
  } catch (error) {
    return privatePageHeaders(
      toErrorResponse(error, "É necessário entrar como administrador."),
    );
  }
}
