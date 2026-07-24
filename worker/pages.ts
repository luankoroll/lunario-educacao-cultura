import { getAdminSession, requireAdminSession } from "../functions/_lib/auth";
import {
  methodNotAllowed,
  privatePageHeaders,
  toErrorResponse,
} from "../functions/_lib/http";
import type {
  FunctionContext,
  RuntimeEnv,
} from "../functions/_lib/types";
import { onRequestPost as adminLogin } from "../functions/api/admin/login";
import { onRequestPost as adminLogout } from "../functions/api/admin/logout";
import { onRequestGet as adminSession } from "../functions/api/admin/sessao";
import { onRequestPost as queryEvaluation } from "../functions/api/admin/formularios/avaliacao-caderno-6-01/consultar";
import { onRequestGet as exportEvaluation } from "../functions/api/admin/formularios/avaliacao-caderno-6-01/exportar";
import {
  onRequestGet as getEvaluationSubmission,
  onRequestPost as postEvaluationSubmission,
} from "../functions/api/formularios/avaliacao-caderno-6-01";
import { onRequestGet as startEvaluation } from "../functions/api/formularios/avaliacao-caderno-6-01/inicio";

interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env extends RuntimeEnv {
  ASSETS: AssetFetcher;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

declare const __ADMIN_LOGIN_HTML__: string;
declare const __ADMIN_DASHBOARD_HTML__: string;

function functionContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): FunctionContext {
  return {
    request,
    env,
    next: () => env.ASSETS.fetch(request),
    waitUntil: (promise) => ctx.waitUntil(promise),
  };
}

function redirect(location: string) {
  return privatePageHeaders(
    new Response(null, {
      status: 302,
      headers: { Location: location },
    }),
  );
}

function privateNotFound() {
  return privatePageHeaders(
    new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }),
  );
}

function privateHtml(request: Request, html: string) {
  return privatePageHeaders(
    new Response(request.method === "HEAD" ? null : html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
}

async function handleAdminPage(request: Request, env: Env) {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  const isLogin = pathname === "/admin/login";
  const isDashboard = pathname === "/admin/formularios";

  if (request.method !== "GET" && request.method !== "HEAD") {
    return privatePageHeaders(methodNotAllowed(["GET", "HEAD"]));
  }

  try {
    const session = await getAdminSession(request, env);
    if (isLogin) {
      return session
        ? redirect("/admin/formularios/")
        : privateHtml(request, __ADMIN_LOGIN_HTML__);
    }
    if (!session) {
      return redirect("/admin/login/");
    }
    if (!isDashboard) {
      return privateNotFound();
    }
    return privateHtml(request, __ADMIN_DASHBOARD_HTML__);
  } catch {
    return isLogin
      ? privateHtml(request, __ADMIN_LOGIN_HTML__)
      : redirect("/admin/login/");
  }
}

async function handleApi(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  const context = functionContext(request, env, ctx);

  if (
    pathname ===
    "/api/formularios/avaliacao-caderno-6-01/inicio"
  ) {
    return request.method === "GET"
      ? startEvaluation(context)
      : methodNotAllowed(["GET"]);
  }
  if (pathname === "/api/formularios/avaliacao-caderno-6-01") {
    if (request.method === "GET") {
      return getEvaluationSubmission(context);
    }
    if (request.method === "POST") {
      return postEvaluationSubmission(context);
    }
    return methodNotAllowed(["GET", "POST"]);
  }
  if (pathname === "/api/admin/login") {
    const response =
      request.method === "POST"
        ? await adminLogin(context)
        : methodNotAllowed(["POST"]);
    return privatePageHeaders(response);
  }

  try {
    await requireAdminSession(request, env);
    let response: Response;
    if (pathname === "/api/admin/sessao" && request.method === "GET") {
      response = await adminSession(context);
    } else if (
      pathname === "/api/admin/logout" &&
      request.method === "POST"
    ) {
      response = await adminLogout(context);
    } else if (
      pathname ===
        "/api/admin/formularios/avaliacao-caderno-6-01/consultar" &&
      request.method === "POST"
    ) {
      response = await queryEvaluation(context);
    } else if (
      pathname ===
        "/api/admin/formularios/avaliacao-caderno-6-01/exportar" &&
      request.method === "GET"
    ) {
      response = await exportEvaluation(context);
    } else {
      response = new Response("Not Found", { status: 404 });
    }
    return privatePageHeaders(response);
  } catch (error) {
    return privatePageHeaders(
      toErrorResponse(error, "É necessário entrar como administrador."),
    );
  }
}

const pagesWorker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return handleApi(request, env, ctx);
    }
    if (pathname === "/admin") {
      return redirect("/admin/formularios/");
    }
    if (pathname.startsWith("/admin/")) {
      return handleAdminPage(request, env);
    }
    if (pathname === "/_private" || pathname.startsWith("/_private/")) {
      return privateNotFound();
    }
    return env.ASSETS.fetch(request);
  },
};

export default pagesWorker;
