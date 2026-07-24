import assert from "node:assert/strict";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import test, { after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { hmr: false, middlewareMode: true },
});

after(async () => {
  await server.close();
});

const security = await server.ssrLoadModule(
  "/functions/_lib/security.ts",
);
const exportsModule = await server.ssrLoadModule(
  "/functions/_lib/export.ts",
);
const adminResponses = await server.ssrLoadModule(
  "/functions/_lib/admin-responses.ts",
);
const auth = await server.ssrLoadModule("/functions/_lib/auth.ts");
const http = await server.ssrLoadModule("/functions/_lib/http.ts");

function validPayload() {
  return {
    submissionKey: "d04ae26c-95a3-4f65-8873-835d555b00e2",
    formToken: "token-com-mais-de-vinte-caracteres",
    fullName: "  Ana\u0007   da Silva  ",
    turma: "6º ano 01",
    answers: Array.from(
      { length: 10 },
      (_, index) => `Resposta ${index + 1}`,
    ),
    comments: "Comentário\r\npedagógico",
    website: "",
  };
}

test("valida, normaliza e rejeita campos inesperados no formulário", () => {
  const result = security.validateEvaluationPayload(validPayload());
  assert.equal(result.fullName, "Ana da Silva");
  assert.equal(result.comments, "Comentário\npedagógico");
  assert.equal(result.answers.length, 10);

  assert.throws(
    () =>
      security.validateEvaluationPayload({
        ...validPayload(),
        unauthorized: "valor",
      }),
    /campos não reconhecidos/i,
  );
  assert.throws(
    () =>
      security.validateEvaluationPayload({
        ...validPayload(),
        answers: ["incompleto"],
      }),
    /dez questões/i,
  );
});

test("token assinado exige espera mínima e rejeita adulteração", async () => {
  const secret = "segredo-de-teste-com-pelo-menos-trinta-e-dois-bytes";
  const now = 1_800_000_000_000;
  const token = await security.issueFormToken(secret, now);

  await assert.rejects(
    security.verifyFormToken(token, secret, now),
    /Aguarde alguns segundos/i,
  );
  await assert.doesNotReject(
    security.verifyFormToken(token, secret, now + 4_000),
  );
  await assert.rejects(
    security.verifyFormToken(`${token}x`, secret, now + 4_000),
    /Atualize a página/i,
  );
});

test("CSV e XLSX neutralizam conteúdo semelhante a fórmula", async () => {
  const rows = [
    ["Nome completo", "Questão 1"],
    ["=HYPERLINK(\"https://example.test\")", "+1+1"],
  ];
  const csv = exportsModule.createCsv(rows);
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'\+1\+1/);

  const xlsx = exportsModule.createXlsx(rows);
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(xlsx);
  const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.doesNotMatch(sheet, /<f(?:\s|>)/);
  assert.match(sheet, /&apos;=HYPERLINK/);
  assert.match(sheet, /&apos;\+1\+1/);
});

test("consulta administrativa filtra, ordena e pagina sem alterar linhas", () => {
  const rows = [
    [
      "id-1",
      "22/07/2026",
      "10:00:00",
      "Bruno",
      "6º ano 01",
      ...Array(10).fill("B"),
      "",
    ],
    [
      "id-2",
      "23/07/2026",
      "09:00:00",
      "Ágata",
      "6º ano 01",
      ...Array(10).fill("A"),
      "",
    ],
  ];
  const result = adminResponses.queryResponseRows(rows, {
    busca: "agata",
    turma: "6º ano 01",
    data: "2026-07-23",
    ordenacao: "nome_asc",
    pagina: 1,
    limite: 10,
  });

  assert.equal(result.total, 1);
  assert.equal(result.resumo.totalRespostas, 2);
  assert.equal(result.registros[0].fullName, "Ágata");
  assert.equal(result.resumo.ultimaResposta, "2026-07-23T09:00:00-03:00");
});

test("senha administrativa aceita somente o hash PBKDF2 correto", async () => {
  const salt = randomBytes(16);
  const iterations = 100_000;
  const expected = pbkdf2Sync(
    "senha-segura-de-teste",
    salt,
    iterations,
    32,
    "sha256",
  );
  const encoded = [
    "pbkdf2-sha256",
    iterations,
    salt.toString("base64url"),
    expected.toString("base64url"),
  ].join("$");

  assert.equal(
    await auth.verifyAdminPassword("senha-segura-de-teste", encoded),
    true,
  );
  assert.equal(await auth.verifyAdminPassword("senha-incorreta", encoded), false);
  assert.equal(
    await auth.verifyAdminPassword(
      "senha-segura-de-teste",
      "pbkdf2-sha256$10$invalido$invalido",
    ),
    false,
  );
});

test("páginas privadas recebem cabeçalhos contra cache, indexação e framing", () => {
  const response = http.privatePageHeaders(
    new Response("<!doctype html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );

  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
});
