import {
  EVALUATION_FORM,
} from "../../../shared/form-definition";
import {
  abortSubmissionCommit,
  beginSubmissionCommit,
  enforceRateLimit,
  getSubmissionStatus,
  markSubmissionCompleted,
  markSubmissionFailed,
  reserveSubmission,
} from "../../_lib/db";
import {
  appendResponseRow,
  formatSaoPauloTimestamp,
  isDefiniteSheetsWriteRejection,
  responseIdExists,
  type ResponseRow,
} from "../../_lib/google-sheets";
import {
  HttpError,
  jsonResponse,
  readJsonBody,
  requireJsonContentType,
  requireRuntimeConfiguration,
  requireSameOrigin,
  toErrorResponse,
} from "../../_lib/http";
import {
  canonicalEvaluationPayload,
  hmacHex,
  validateEvaluationPayload,
  validateSubmissionKey,
  verifyFormToken,
} from "../../_lib/security";
import type { FunctionContext } from "../../_lib/types";

const SUCCESS_MESSAGE =
  "Autoavaliação enviada. Sua resposta foi registrada.";

function successResponse(responseId: string) {
  return jsonResponse({
    ok: true,
    status: "completed",
    responseId,
    message: SUCCESS_MESSAGE,
  });
}

function processingResponse() {
  return jsonResponse(
    {
      ok: false,
      status: "processing",
      message: "O envio ainda está sendo confirmado.",
    },
    202,
  );
}

export async function onRequestGet(context: FunctionContext) {
  try {
    requireRuntimeConfiguration(context.env, [
      "FORM_DB",
      "RATE_LIMIT_SECRET",
      "FORM_TOKEN_SECRET",
    ]);
    await enforceRateLimit(context, "form_status", 300, 10 * 60);

    const submissionKey = validateSubmissionKey(
      new URL(context.request.url).searchParams.get("submissionKey"),
    );
    const keyHash = await hmacHex(
      context.env.FORM_TOKEN_SECRET!,
      `submission:${submissionKey}`,
    );
    const submission = await getSubmissionStatus(
      context.env.FORM_DB!,
      keyHash,
    );

    if (submission?.state === "completed") {
      return successResponse(submission.response_id);
    }
    if (submission?.state === "processing") {
      return processingResponse();
    }

    return jsonResponse(
      {
        ok: false,
        status: "not_found",
        message: "Nenhum envio confirmado foi encontrado.",
      },
      404,
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "Não foi possível verificar o envio.",
    );
  }
}

export async function onRequestPost(context: FunctionContext) {
  try {
    requireRuntimeConfiguration(context.env, [
      "FORM_DB",
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SPREADSHEET_ID",
      "RATE_LIMIT_SECRET",
      "FORM_TOKEN_SECRET",
    ]);
    requireSameOrigin(context.request);
    requireJsonContentType(context.request);
    await enforceRateLimit(context, "form_submit", 120, 10 * 60);

    const payload = validateEvaluationPayload(
      await readJsonBody(context.request),
    );
    const idempotencyHeader =
      context.request.headers.get("Idempotency-Key") ?? "";
    if (idempotencyHeader !== payload.submissionKey) {
      throw new HttpError(
        400,
        "invalid_idempotency_key",
        "A chave de envio é inválida.",
      );
    }

    if (payload.website) {
      return jsonResponse({
        ok: true,
        status: "completed",
        message: SUCCESS_MESSAGE,
      });
    }

    await verifyFormToken(
      payload.formToken,
      context.env.FORM_TOKEN_SECRET!,
    );

    const keyHash = await hmacHex(
      context.env.FORM_TOKEN_SECRET!,
      `submission:${payload.submissionKey}`,
    );
    const payloadHash = await hmacHex(
      context.env.FORM_TOKEN_SECRET!,
      `payload:${canonicalEvaluationPayload(payload)}`,
    );
    const reservation = await reserveSubmission(
      context.env.FORM_DB!,
      keyHash,
      payloadHash,
      crypto.randomUUID(),
    );

    if (reservation.status === "completed") {
      return successResponse(reservation.responseId);
    }
    if (reservation.status === "processing") {
      if (reservation.phase === "committing") {
        try {
          if (
            await responseIdExists(
              context.env,
              reservation.responseId,
            )
          ) {
            await markSubmissionCompleted(
              context.env.FORM_DB!,
              keyHash,
              payloadHash,
              reservation.lease,
            );
            const confirmed = await getSubmissionStatus(
              context.env.FORM_DB!,
              keyHash,
            );
            if (confirmed?.state === "completed") {
              return successResponse(confirmed.response_id);
            }
          }
        } catch {
          // A chave permanece cercada: nenhuma nova linha pode ser anexada.
        }
      }
      return processingResponse();
    }

    const responseId = reservation.responseId;
    let commitStarted = false;
    try {
      const alreadyStored = await responseIdExists(
        context.env,
        responseId,
      );
      if (alreadyStored) {
        await markSubmissionCompleted(
          context.env.FORM_DB!,
          keyHash,
          payloadHash,
          reservation.lease,
        );
        const confirmed = await getSubmissionStatus(
          context.env.FORM_DB!,
          keyHash,
        );
        if (confirmed?.state === "completed") {
          return successResponse(confirmed.response_id);
        }
        return processingResponse();
      }

      commitStarted = await beginSubmissionCommit(
        context.env.FORM_DB!,
        keyHash,
        payloadHash,
        reservation.lease,
      );
      if (!commitStarted) {
        const current = await getSubmissionStatus(
          context.env.FORM_DB!,
          keyHash,
        );
        if (current?.state === "completed") {
          return successResponse(current.response_id);
        }
        return processingResponse();
      }

      const timestamp = formatSaoPauloTimestamp();
      const row = [
        responseId,
        timestamp.date,
        timestamp.time,
        payload.fullName,
        EVALUATION_FORM.turma,
        ...payload.answers,
        payload.comments,
      ] as ResponseRow;
      await appendResponseRow(context.env, row);

      await markSubmissionCompleted(
        context.env.FORM_DB!,
        keyHash,
        payloadHash,
        reservation.lease,
      );
      const confirmed = await getSubmissionStatus(
        context.env.FORM_DB!,
        keyHash,
      );
      return confirmed?.state === "completed"
        ? successResponse(confirmed.response_id)
        : processingResponse();
    } catch (error) {
      if (commitStarted) {
        let confirmedAbsent = false;
        try {
          if (await responseIdExists(context.env, responseId)) {
            await markSubmissionCompleted(
              context.env.FORM_DB!,
              keyHash,
              payloadHash,
              reservation.lease,
            );
            const confirmed = await getSubmissionStatus(
              context.env.FORM_DB!,
              keyHash,
            );
            if (confirmed?.state === "completed") {
              return successResponse(confirmed.response_id);
            }
          } else {
            confirmedAbsent = true;
          }
        } catch {
          // A confirmação será retomada com a mesma chave de submissão.
        }

        if (
          confirmedAbsent &&
          isDefiniteSheetsWriteRejection(error)
        ) {
          const aborted = await abortSubmissionCommit(
            context.env.FORM_DB!,
            keyHash,
            payloadHash,
            reservation.lease,
          );
          if (aborted) {
            throw new HttpError(
              502,
              "submission_failed",
              "Não foi possível registrar sua resposta. Verifique sua conexão e tente novamente.",
            );
          }
        }

        // Depois do início do append, uma falha pode significar apenas que a
        // resposta HTTP se perdeu. Manter o fence impede um segundo append.
        return processingResponse();
      }

      try {
        if (await responseIdExists(context.env, responseId)) {
          await markSubmissionCompleted(
            context.env.FORM_DB!,
            keyHash,
            payloadHash,
            reservation.lease,
          );
          const confirmed = await getSubmissionStatus(
            context.env.FORM_DB!,
            keyHash,
          );
          if (confirmed?.state === "completed") {
            return successResponse(confirmed.response_id);
          }
        }
      } catch {
        // Nenhum append foi iniciado; o lease pode ser liberado com segurança.
      }

      await markSubmissionFailed(
        context.env.FORM_DB!,
        keyHash,
        payloadHash,
        reservation.lease,
      );
      throw new HttpError(
        502,
        "submission_failed",
        "Não foi possível registrar sua resposta. Verifique sua conexão e tente novamente.",
      );
    }
  } catch (error) {
    return toErrorResponse(
      error,
      "Não foi possível registrar sua resposta. Verifique sua conexão e tente novamente.",
    );
  }
}
