import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test, { after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { hmr: false, middlewareMode: true },
});

const googleSheets = await server.ssrLoadModule(
  "/functions/_lib/google-sheets.ts",
);
const formDefinition = await server.ssrLoadModule(
  "/shared/form-definition.ts",
);
const adminMiddleware = await server.ssrLoadModule(
  "/functions/api/admin/_middleware.ts",
);

const originalFetch = globalThis.fetch;
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: {
    format: "pem",
    type: "pkcs8",
  },
  publicKeyEncoding: {
    format: "pem",
    type: "spki",
  },
});

after(async () => {
  globalThis.fetch = originalFetch;
  await server.close();
});

function testEnvironment(suffix) {
  return {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: `service-${suffix}@example.test`,
    GOOGLE_PRIVATE_KEY: privateKey,
    GOOGLE_SPREADSHEET_ID: `spreadsheet-${suffix}`,
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function decodedValuesRange(url) {
  const marker = "/values/";
  const start = url.pathname.indexOf(marker);
  assert.notEqual(start, -1, `URL sem intervalo de valores: ${url}`);
  return decodeURIComponent(url.pathname.slice(start + marker.length));
}

async function withFetchMock(mock, callback) {
  globalThis.fetch = mock;
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("integração do Google Sheets", async (suite) => {
  await suite.test(
    "confere os 16 cabeçalhos A:P e faz append com RAW e INSERT_ROWS",
    async () => {
      const expectedHeaders = [
        "ID da resposta",
        "Data do envio",
        "Horário do envio",
        "Nome completo",
        "Turma",
        "Questão 1",
        "Questão 2",
        "Questão 3",
        "Questão 4",
        "Questão 5",
        "Questão 6",
        "Questão 7",
        "Questão 8",
        "Questão 9",
        "Questão 10",
        "Comentários",
      ];
      assert.deepEqual([...formDefinition.RESPONSE_HEADERS], expectedHeaders);
      assert.equal(formDefinition.RESPONSE_COLUMN_COUNT, 16);

      const env = testEnvironment("append");
      const row = [
        "resposta-01",
        "23/07/2026",
        "14:15:16",
        "Ana da Silva",
        "6º ano 01",
        ...Array.from({ length: 10 }, (_, index) => `Resposta ${index + 1}`),
        "Comentário",
      ];
      assert.equal(row.length, 16);

      const requests = [];
      await withFetchMock(async (input, init = {}) => {
        const url = new URL(String(input));
        requests.push({ url, init });

        if (url.href === "https://oauth2.googleapis.com/token") {
          return jsonResponse({
            access_token: "token-append",
            expires_in: 3600,
          });
        }

        const range = decodedValuesRange(url);
        if (range === "Respostas!A1:P1") {
          return jsonResponse({ values: [expectedHeaders] });
        }
        if (range === "Respostas!A:P:append") {
          return jsonResponse({ updates: { updatedRows: 1 } });
        }

        throw new Error(`Requisição inesperada: ${url}`);
      }, () => googleSheets.appendResponseRow(env, row));

      assert.equal(requests.length, 3);
      const tokenRequest = requests[0];
      assert.equal(tokenRequest.init.method, "POST");
      assert.equal(
        new URLSearchParams(tokenRequest.init.body).get("grant_type"),
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      );

      const headerRequest = requests[1];
      assert.equal(decodedValuesRange(headerRequest.url), "Respostas!A1:P1");
      assert.equal(
        headerRequest.url.searchParams.get("majorDimension"),
        "ROWS",
      );

      const appendRequest = requests[2];
      assert.equal(
        decodedValuesRange(appendRequest.url),
        "Respostas!A:P:append",
      );
      assert.equal(
        appendRequest.url.searchParams.get("valueInputOption"),
        "RAW",
      );
      assert.equal(
        appendRequest.url.searchParams.get("insertDataOption"),
        "INSERT_ROWS",
      );
      assert.equal(appendRequest.init.method, "POST");
      assert.equal(
        new Headers(appendRequest.init.headers).get("Authorization"),
        "Bearer token-append",
      );
      assert.equal(
        new Headers(appendRequest.init.headers).get("Content-Type"),
        "application/json; charset=utf-8",
      );
      assert.deepEqual(JSON.parse(appendRequest.init.body), {
        majorDimension: "ROWS",
        values: [row],
      });
    },
  );

  await suite.test(
    "lê A2:P, preenche células ausentes e consulta IDs existentes",
    async () => {
      const env = testEnvironment("read");
      const ranges = [];
      const sourceRows = [
        [
          "id-1",
          "22/07/2026",
          "09:10:11",
          "Ana",
          "6º ano 01",
          "Resposta curta",
        ],
        Array(16).fill(""),
        [
          "id-2",
          "23/07/2026",
          "12:13:14",
          "Bruno",
          "6º ano 01",
          ...Array(10).fill("Resposta"),
          "Observação",
        ],
      ];

      await withFetchMock(async (input) => {
        const url = new URL(String(input));
        if (url.href === "https://oauth2.googleapis.com/token") {
          return jsonResponse({
            access_token: "token-read",
            expires_in: 3600,
          });
        }

        const range = decodedValuesRange(url);
        ranges.push(range);
        if (range === "Respostas!A1:P1") {
          return jsonResponse({
            values: [[...formDefinition.RESPONSE_HEADERS]],
          });
        }
        if (range === "Respostas!A2:P") {
          return jsonResponse({ values: sourceRows });
        }
        if (range === "Respostas!A2:A") {
          return jsonResponse({ values: [["id-0"], ["id-2"]] });
        }
        throw new Error(`Requisição inesperada: ${url}`);
      }, async () => {
        const rows = await googleSheets.readResponseRows(env);
        assert.equal(rows.length, 2);
        assert.equal(rows[0].length, 16);
        assert.deepEqual(rows[0].slice(0, 6), sourceRows[0]);
        assert.equal(rows[0][15], "");
        assert.equal(rows[1][0], "id-2");
        assert.equal(rows[1][15], "Observação");

        assert.equal(await googleSheets.responseIdExists(env, "id-2"), true);
        assert.equal(
          await googleSheets.responseIdExists(env, "id-inexistente"),
          false,
        );
      });

      assert.deepEqual(ranges, [
        "Respostas!A1:P1",
        "Respostas!A2:P",
        "Respostas!A2:A",
        "Respostas!A2:A",
      ]);
    },
  );

  await suite.test(
    "converte falhas do Google em erro genérico sem vazar detalhes",
    async () => {
      const env = testEnvironment("google-error");
      await withFetchMock(async (input) => {
        const url = new URL(String(input));
        if (url.href === "https://oauth2.googleapis.com/token") {
          return jsonResponse({
            access_token: "token-error",
            expires_in: 3600,
          });
        }
        return jsonResponse(
          {
            error: {
              message:
                "private credential detail that must never reach the client",
            },
          },
          403,
        );
      }, async () => {
        await assert.rejects(
          () => googleSheets.readResponseRows(env),
          (error) => {
            assert.equal(error.status, 502);
            assert.equal(error.code, "sheets_unavailable");
            assert.equal(
              error.message,
              "Não foi possível acessar o repositório de respostas.",
            );
            assert.doesNotMatch(
              error.message,
              /private|credential|google|403/i,
            );
            return true;
          },
        );
      });
    },
  );

  await suite.test(
    "distingue rejeição 4xx de falha 5xx ambígua no append",
    async () => {
      const row = [
        "id-rejeicao",
        "23/07/2026",
        "15:16:17",
        "Ana",
        "6º ano 01",
        ...Array(10).fill("Resposta"),
        "",
      ];

      async function appendError(remoteStatus, suffix) {
        const env = testEnvironment(suffix);
        let captured;
        await withFetchMock(async (input) => {
          const url = new URL(String(input));
          if (url.href === "https://oauth2.googleapis.com/token") {
            return jsonResponse({
              access_token: `token-${suffix}`,
              expires_in: 3600,
            });
          }

          const range = decodedValuesRange(url);
          if (range === "Respostas!A1:P1") {
            return jsonResponse({
              values: [[...formDefinition.RESPONSE_HEADERS]],
            });
          }
          if (range === "Respostas!A:P:append") {
            return jsonResponse({ error: { message: "privado" } }, remoteStatus);
          }
          throw new Error(`Requisição inesperada: ${url}`);
        }, async () => {
          await assert.rejects(
            () => googleSheets.appendResponseRow(env, row),
            (error) => {
              captured = error;
              assert.equal(error.status, 502);
              assert.equal(error.code, "sheets_unavailable");
              return true;
            },
          );
        });
        return captured;
      }

      const rejected = await appendError(403, "append-403");
      assert.equal(
        googleSheets.isDefiniteSheetsWriteRejection(rejected),
        true,
      );

      const ambiguous = await appendError(503, "append-503");
      assert.equal(
        googleSheets.isDefiniteSheetsWriteRejection(ambiguous),
        false,
      );
    },
  );
});

test("middleware administrativo bloqueia exportação sem sessão", async () => {
  let nextCalled = false;
  const response = await adminMiddleware.onRequest({
    request: new Request(
      "https://lunario.example/api/admin/formularios/avaliacao-caderno-6-01/exportar?formato=csv",
    ),
    env: {
      FORM_DB: {},
      ADMIN_SESSION_SECRET:
        "segredo-de-sessão-com-pelo-menos-trinta-e-dois-bytes",
    },
    next: async () => {
      nextCalled = true;
      return new Response("arquivo privado");
    },
    waitUntil() {},
  });

  assert.equal(nextCalled, false);
  assert.equal(response.status, 401);
  assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
  assert.match(
    response.headers.get("X-Robots-Tag") ?? "",
    /noindex,\s*nofollow/,
  );
  assert.deepEqual(await response.json(), {
    ok: false,
    code: "authentication_required",
    message: "É necessário entrar como administrador.",
  });
});
