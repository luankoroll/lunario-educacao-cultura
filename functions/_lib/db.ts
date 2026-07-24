import { EVALUATION_FORM } from "../../shared/form-definition";
import { HttpError, getClientIp } from "./http";
import { hmacHex } from "./security";
import type { D1Database, FunctionContext } from "./types";

type SubmissionRow = {
  payload_hash: string;
  response_id: string;
  state: "processing" | "completed" | "failed";
  lease_until: number;
  lease_id: string;
  fence_token: number;
  commit_started_at: number | null;
};

export type SubmissionLease = {
  leaseId: string;
  fenceToken: number;
};

export type SubmissionReservation =
  | {
      status: "acquired";
      responseId: string;
      lease: SubmissionLease;
    }
  | { status: "completed"; responseId: string }
  | {
      status: "processing";
      responseId: string;
      phase: "processing" | "committing";
      lease: SubmissionLease;
    };

export async function enforceRateLimit(
  context: Pick<FunctionContext, "request" | "env" | "waitUntil">,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const database = context.env.FORM_DB;
  const secret = context.env.RATE_LIMIT_SECRET;
  if (!database || !secret) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStartedAt = Math.floor(now / windowSeconds) * windowSeconds;
  const expiresAt = windowStartedAt + windowSeconds * 2;
  const bucketHash = await hmacHex(
    secret,
    `${scope}:${getClientIp(context.request)}:${windowStartedAt}`,
  );

  const row = await database
    .prepare(
      `INSERT INTO form_rate_limits (
        scope,
        bucket_hash,
        window_started_at,
        request_count,
        expires_at
      ) VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(scope, bucket_hash) DO UPDATE SET
        request_count = request_count + 1,
        expires_at = excluded.expires_at
      RETURNING request_count`,
    )
    .bind(scope, bucketHash, windowStartedAt, expiresAt)
    .first<{ request_count: number }>();

  if (!row || Number(row.request_count) > limit) {
    throw new HttpError(
      429,
      "rate_limit_exceeded",
      "Muitas solicitações foram recebidas. Aguarde alguns minutos e tente novamente.",
    );
  }

  if (Math.random() < 0.02) {
    context.waitUntil(
      database
        .prepare("DELETE FROM form_rate_limits WHERE expires_at < ?")
        .bind(now)
        .run()
        .then(() => undefined),
    );
  }
}

export async function reserveSubmission(
  database: D1Database,
  keyHash: string,
  payloadHash: string,
  proposedResponseId: string,
): Promise<SubmissionReservation> {
  const now = Math.floor(Date.now() / 1000);
  const leaseUntil = now + 90;
  const proposedLeaseId = crypto.randomUUID();
  const inserted = await database
    .prepare(
      `INSERT OR IGNORE INTO form_submission_idempotency (
        form_slug,
        key_hash,
        payload_hash,
        response_id,
        state,
        lease_until,
        lease_id,
        fence_token,
        commit_started_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'processing', ?, ?, 1, NULL, ?, ?)`,
    )
    .bind(
      EVALUATION_FORM.slug,
      keyHash,
      payloadHash,
      proposedResponseId,
      leaseUntil,
      proposedLeaseId,
      now,
      now,
    )
    .run();

  if ((inserted.meta?.changes ?? 0) > 0) {
    return {
      status: "acquired",
      responseId: proposedResponseId,
      lease: { leaseId: proposedLeaseId, fenceToken: 1 },
    };
  }

  const existing = await getSubmission(database, keyHash);
  if (!existing) {
    throw new HttpError(
      503,
      "service_unavailable",
      "O serviço está temporariamente indisponível.",
    );
  }

  if (existing.payload_hash !== payloadHash) {
    throw new HttpError(
      409,
      "idempotency_conflict",
      "Esta chave de envio já foi utilizada com outras respostas.",
    );
  }

  if (existing.state === "completed") {
    return { status: "completed", responseId: existing.response_id };
  }

  if (existing.commit_started_at !== null) {
    return processingReservation(existing, "committing");
  }

  if (existing.state === "processing" && existing.lease_until > now) {
    return processingReservation(existing, "processing");
  }

  const nextLeaseId = crypto.randomUUID();
  const acquired = await database
    .prepare(
      `UPDATE form_submission_idempotency
      SET state = 'processing',
        lease_until = ?,
        lease_id = ?,
        fence_token = fence_token + 1,
        commit_started_at = NULL,
        completed_at = NULL,
        updated_at = ?
      WHERE form_slug = ?
        AND key_hash = ?
        AND payload_hash = ?
        AND lease_id = ?
        AND fence_token = ?
        AND commit_started_at IS NULL
        AND (
          state = 'failed'
          OR (state = 'processing' AND lease_until <= ?)
        )
      RETURNING response_id, lease_id, fence_token`,
    )
    .bind(
      leaseUntil,
      nextLeaseId,
      now,
      EVALUATION_FORM.slug,
      keyHash,
      payloadHash,
      existing.lease_id,
      existing.fence_token,
      now,
    )
    .first<{
      response_id: string;
      lease_id: string;
      fence_token: number;
    }>();

  if (acquired) {
    return {
      status: "acquired",
      responseId: acquired.response_id,
      lease: {
        leaseId: acquired.lease_id,
        fenceToken: Number(acquired.fence_token),
      },
    };
  }

  const refreshed = await getSubmission(database, keyHash);
  if (refreshed?.state === "completed") {
    return { status: "completed", responseId: refreshed.response_id };
  }

  const current = refreshed ?? existing;
  return processingReservation(
    current,
    current.commit_started_at !== null ? "committing" : "processing",
  );
}

export async function beginSubmissionCommit(
  database: D1Database,
  keyHash: string,
  payloadHash: string,
  lease: SubmissionLease,
) {
  const now = Math.floor(Date.now() / 1000);
  const result = await database
    .prepare(
      `UPDATE form_submission_idempotency
      SET commit_started_at = ?,
        lease_until = 0,
        updated_at = ?
      WHERE form_slug = ?
        AND key_hash = ?
        AND payload_hash = ?
        AND state = 'processing'
        AND commit_started_at IS NULL
        AND lease_id = ?
        AND fence_token = ?
        AND lease_until > ?`,
    )
    .bind(
      now,
      now,
      EVALUATION_FORM.slug,
      keyHash,
      payloadHash,
      lease.leaseId,
      lease.fenceToken,
      now,
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function markSubmissionCompleted(
  database: D1Database,
  keyHash: string,
  payloadHash: string,
  lease: SubmissionLease,
) {
  const now = Math.floor(Date.now() / 1000);
  const result = await database
    .prepare(
      `UPDATE form_submission_idempotency
      SET state = 'completed',
        completed_at = ?,
        updated_at = ?,
        lease_until = 0
      WHERE form_slug = ?
        AND key_hash = ?
        AND payload_hash = ?
        AND state = 'processing'
        AND lease_id = ?
        AND fence_token = ?`,
    )
    .bind(
      now,
      now,
      EVALUATION_FORM.slug,
      keyHash,
      payloadHash,
      lease.leaseId,
      lease.fenceToken,
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function markSubmissionFailed(
  database: D1Database,
  keyHash: string,
  payloadHash: string,
  lease: SubmissionLease,
) {
  const now = Math.floor(Date.now() / 1000);
  const result = await database
    .prepare(
      `UPDATE form_submission_idempotency
      SET state = 'failed', updated_at = ?, lease_until = 0
      WHERE form_slug = ?
        AND key_hash = ?
        AND payload_hash = ?
        AND state = 'processing'
        AND commit_started_at IS NULL
        AND lease_id = ?
        AND fence_token = ?`,
    )
    .bind(
      now,
      EVALUATION_FORM.slug,
      keyHash,
      payloadHash,
      lease.leaseId,
      lease.fenceToken,
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function abortSubmissionCommit(
  database: D1Database,
  keyHash: string,
  payloadHash: string,
  lease: SubmissionLease,
) {
  const now = Math.floor(Date.now() / 1000);
  const result = await database
    .prepare(
      `UPDATE form_submission_idempotency
      SET state = 'failed',
        commit_started_at = NULL,
        updated_at = ?,
        lease_until = 0
      WHERE form_slug = ?
        AND key_hash = ?
        AND payload_hash = ?
        AND state = 'processing'
        AND commit_started_at IS NOT NULL
        AND lease_id = ?
        AND fence_token = ?`,
    )
    .bind(
      now,
      EVALUATION_FORM.slug,
      keyHash,
      payloadHash,
      lease.leaseId,
      lease.fenceToken,
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function getSubmissionStatus(
  database: D1Database,
  keyHash: string,
) {
  return getSubmission(database, keyHash);
}

async function getSubmission(database: D1Database, keyHash: string) {
  return database
    .prepare(
      `SELECT
        payload_hash,
        response_id,
        state,
        lease_until,
        lease_id,
        fence_token,
        commit_started_at
      FROM form_submission_idempotency
      WHERE form_slug = ? AND key_hash = ?`,
    )
    .bind(EVALUATION_FORM.slug, keyHash)
    .first<SubmissionRow>();
}

function processingReservation(
  row: SubmissionRow,
  phase: "processing" | "committing",
): SubmissionReservation {
  return {
    status: "processing",
    responseId: row.response_id,
    phase,
    lease: {
      leaseId: row.lease_id,
      fenceToken: Number(row.fence_token),
    },
  };
}
