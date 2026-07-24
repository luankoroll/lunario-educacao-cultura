ALTER TABLE form_submission_idempotency
  ADD COLUMN lease_id TEXT NOT NULL DEFAULT '';

ALTER TABLE form_submission_idempotency
  ADD COLUMN fence_token INTEGER NOT NULL DEFAULT 0;

ALTER TABLE form_submission_idempotency
  ADD COLUMN commit_started_at INTEGER;

UPDATE form_submission_idempotency
SET
  lease_id = 'legacy:' || response_id,
  fence_token = 1
WHERE lease_id = '';
