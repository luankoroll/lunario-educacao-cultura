import assert from "node:assert/strict";
import test, { after, beforeEach } from "node:test";
import { Miniflare } from "miniflare";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { hmr: false, middlewareMode: true },
});
const submissions = await server.ssrLoadModule("/functions/_lib/db.ts");
const schema = await server.ssrLoadModule("/db/schema.ts");

let miniflare;
let database;

beforeEach(async () => {
  await miniflare?.dispose();
  miniflare = new Miniflare({
    modules: true,
    script:
      "export default { fetch() { return new Response('test only') } }",
    d1Databases: ["FORM_DB"],
  });
  database = await miniflare.getD1Database("FORM_DB");
  for (const statement of schema.formControlSchemaStatements) {
    await database.prepare(statement).run();
  }
});

after(async () => {
  await miniflare?.dispose();
  await server.close();
});

test("fencing impede que um lease obsoleto inicie ou finalize o append", async () => {
  const keyHash = "key-hash";
  const payloadHash = "payload-hash";
  const first = await submissions.reserveSubmission(
    database,
    keyHash,
    payloadHash,
    "response-id",
  );
  assert.equal(first.status, "acquired");

  await database
    .prepare(
      "UPDATE form_submission_idempotency SET lease_until = 0 WHERE key_hash = ?",
    )
    .bind(keyHash)
    .run();

  const takeover = await submissions.reserveSubmission(
    database,
    keyHash,
    payloadHash,
    "unused-response-id",
  );
  assert.equal(takeover.status, "acquired");
  assert.equal(takeover.responseId, "response-id");
  assert.notEqual(takeover.lease.leaseId, first.lease.leaseId);
  assert.equal(takeover.lease.fenceToken, first.lease.fenceToken + 1);

  assert.equal(
    await submissions.beginSubmissionCommit(
      database,
      keyHash,
      payloadHash,
      first.lease,
    ),
    false,
  );
  assert.equal(
    await submissions.beginSubmissionCommit(
      database,
      keyHash,
      payloadHash,
      takeover.lease,
    ),
    true,
  );

  const concurrentRetry = await submissions.reserveSubmission(
    database,
    keyHash,
    payloadHash,
    "another-unused-id",
  );
  assert.equal(concurrentRetry.status, "processing");
  assert.equal(concurrentRetry.phase, "committing");

  assert.equal(
    await submissions.markSubmissionCompleted(
      database,
      keyHash,
      payloadHash,
      first.lease,
    ),
    false,
  );
  assert.equal(
    await submissions.markSubmissionCompleted(
      database,
      keyHash,
      payloadHash,
      takeover.lease,
    ),
    true,
  );

  const completed = await submissions.reserveSubmission(
    database,
    keyHash,
    payloadHash,
    "ignored-id",
  );
  assert.deepEqual(completed, {
    status: "completed",
    responseId: "response-id",
  });
});

test("rejeição definida pode abortar o commit sem liberar lease alheio", async () => {
  const keyHash = "abort-key";
  const payloadHash = "abort-payload";
  const first = await submissions.reserveSubmission(
    database,
    keyHash,
    payloadHash,
    "abort-response",
  );
  assert.equal(first.status, "acquired");
  assert.equal(
    await submissions.beginSubmissionCommit(
      database,
      keyHash,
      payloadHash,
      first.lease,
    ),
    true,
  );
  assert.equal(
    await submissions.abortSubmissionCommit(
      database,
      keyHash,
      payloadHash,
      first.lease,
    ),
    true,
  );

  const retry = await submissions.reserveSubmission(
    database,
    keyHash,
    payloadHash,
    "ignored-response",
  );
  assert.equal(retry.status, "acquired");
  assert.equal(retry.responseId, "abort-response");
  assert.equal(retry.lease.fenceToken, first.lease.fenceToken + 1);

  assert.equal(
    await submissions.abortSubmissionCommit(
      database,
      keyHash,
      payloadHash,
      first.lease,
    ),
    false,
  );
});

test("a mesma chave nunca pode ser reutilizada com outro conteúdo", async () => {
  await submissions.reserveSubmission(
    database,
    "conflict-key",
    "payload-a",
    "conflict-response",
  );

  await assert.rejects(
    submissions.reserveSubmission(
      database,
      "conflict-key",
      "payload-b",
      "other-response",
    ),
    (error) => {
      assert.equal(error.status, 409);
      assert.equal(error.code, "idempotency_conflict");
      return true;
    },
  );
});
