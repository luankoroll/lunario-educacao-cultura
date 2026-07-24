/** Cloudflare Worker entry point used by the private Sites deployment. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
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
import {
  onRequestGet as getEvaluationSubmission,
  onRequestPost as postEvaluationSubmission,
} from "../functions/api/formularios/avaliacao-caderno-6-01";
import { onRequestGet as startEvaluation } from "../functions/api/formularios/avaliacao-caderno-6-01/inicio";
import { onRequestPost as adminLogin } from "../functions/api/admin/login";
import { onRequestPost as adminLogout } from "../functions/api/admin/logout";
import { onRequestGet as adminSession } from "../functions/api/admin/sessao";
import { onRequestPost as queryEvaluation } from "../functions/api/admin/formularios/avaliacao-caderno-6-01/consultar";
import { onRequestGet as exportEvaluation } from "../functions/api/admin/formularios/avaliacao-caderno-6-01/exportar";

interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env extends RuntimeEnv {
  ASSETS: AssetFetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function functionContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): FunctionContext {
  return {
    request,
    env,
    next: () => handler.fetch(request, env, ctx),
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

async function handleApi(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");
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

async function handleAdminPage(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");
  // vinext sets this process-only flag and an authenticated internal header
  // while its build process pre-renders the export. Neither value is present
  // in the deployed Worker runtime, so a public Host header cannot bypass auth.
  const isBuildPrerender =
    process.env.VINEXT_PRERENDER === "1" &&
    request.headers.has("x-vinext-prerender-secret");
  if (isBuildPrerender) {
    return handler.fetch(request, env, ctx);
  }
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
        : privatePageHeaders(await handler.fetch(request, env, ctx));
    }
    if (!session) {
      return redirect("/admin/login/");
    }
    if (!isDashboard) {
      return privatePageHeaders(
        new Response("Not Found", { status: 404 }),
      );
    }
    return privatePageHeaders(await handler.fetch(request, env, ctx));
  } catch {
    return isLogin
      ? privatePageHeaders(await handler.fetch(request, env, ctx))
      : redirect("/admin/login/");
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleApi(request, env, ctx);
    }

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      return handleAdminPage(request, env, ctx);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
