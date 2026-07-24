"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

const FORM_ENDPOINT = "/api/formularios/avaliacao-caderno-6-01";
const CONFIRMATION_URL =
  "/formularios/avaliacao-caderno-6-01/enviado/";
const SUBMISSION_KEY_STORAGE =
  "lunario:avaliacao-caderno-6-01:submission-key";
const STARTED_AT_STORAGE =
  "lunario:avaliacao-caderno-6-01:started-at";

type SubmissionStatus = "idle" | "sending" | "error";

type ApiResponse = {
  formToken?: string;
  ok?: boolean;
  responseId?: string;
  status?: string;
};

function createSubmissionIdentity() {
  const storedKey = window.localStorage.getItem(SUBMISSION_KEY_STORAGE);
  const storedStartedAt = window.localStorage.getItem(STARTED_AT_STORAGE);

  if (storedKey && storedStartedAt) {
    return { startedAt: storedStartedAt, submissionKey: storedKey };
  }

  const submissionKey = window.crypto.randomUUID();
  const startedAt = new Date().toISOString();

  window.localStorage.setItem(SUBMISSION_KEY_STORAGE, submissionKey);
  window.localStorage.setItem(STARTED_AT_STORAGE, startedAt);

  return { startedAt, submissionKey };
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return {};
  }
}

async function requestFormToken() {
  const response = await fetch(`${FORM_ENDPOINT}/inicio`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const data = await readJson(response);

  if (!response.ok || !data.formToken) {
    throw new Error("Não foi possível iniciar o formulário.");
  }

  return data.formToken;
}

export function EvaluationForm() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const submissionIdentityRef = useRef<{
    submissionKey: string;
    startedAt: string;
  } | null>(null);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [formToken, setFormToken] = useState("");

  useEffect(() => {
    submissionIdentityRef.current = createSubmissionIdentity();

    requestFormToken()
      .then(setFormToken)
      .catch(() => {
        // Uma nova tentativa será feita quando o estudante enviar o formulário.
      });
  }, []);

  function finishSubmission() {
    window.localStorage.removeItem(SUBMISSION_KEY_STORAGE);
    window.localStorage.removeItem(STARTED_AT_STORAGE);
    formRef.current?.reset();
    window.location.assign(CONFIRMATION_URL);
  }

  async function verifySubmission(key: string) {
    const response = await fetch(
      `${FORM_ENDPOINT}?submissionKey=${encodeURIComponent(key)}`,
      {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      },
    );
    const data = await readJson(response);
    return response.ok && data.ok === true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "sending") {
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    const identity =
      submissionIdentityRef.current ?? createSubmissionIdentity();
    const formData = new FormData(form);
    const answers = Array.from({ length: 10 }, (_, index) =>
      String(formData.get(`question${index + 1}`) ?? "").trim(),
    );

    submissionIdentityRef.current = identity;
    setStatus("sending");

    try {
      const activeFormToken = formToken || (await requestFormToken());
      setFormToken(activeFormToken);

      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Idempotency-Key": identity.submissionKey,
        },
        body: JSON.stringify({
          submissionKey: identity.submissionKey,
          startedAt: identity.startedAt,
          formToken: activeFormToken,
          fullName: String(formData.get("fullName") ?? "").trim(),
          turma: "6º ano 01",
          answers,
          comments: String(formData.get("comments") ?? "").trim(),
          website: String(formData.get("website") ?? ""),
        }),
      });
      const data = await readJson(response);

      if (response.ok && data.ok === true) {
        finishSubmission();
        return;
      }

      // A confirmação pode ter se perdido mesmo quando o servidor devolve um
      // conflito ou erro. Consulte a chave antes de permitir um novo envio.
      const wasRegistered = await verifySubmission(identity.submissionKey);
      if (wasRegistered) {
        finishSubmission();
        return;
      }

      setStatus("error");
    } catch {
      try {
        const wasRegistered = await verifySubmission(identity.submissionKey);
        if (wasRegistered) {
          finishSubmission();
          return;
        }
      } catch {
        // A mensagem pública permanece genérica para não expor detalhes internos.
      }

      setStatus("error");
    }
  }

  return (
    <form
      aria-busy={status === "sending"}
      aria-describedby={`${formId}-instructions ${formId}-status`}
      className="evaluation-form"
      noValidate
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div className="evaluation-form__intro" id={`${formId}-instructions`}>
        <p className="form-required-note">
          Responda às dez questões. Todos os campos, exceto comentários, são
          obrigatórios.
        </p>
        <p>
          As questões correspondem ao caderno de Língua Portuguesa do 6º ano,
          2º trimestre de 2025.
        </p>
      </div>

      <div className="form-grid form-grid--identity">
        <div className="form-field">
          <label htmlFor={`${formId}-full-name`}>Nome completo *</label>
          <input
            autoComplete="name"
            id={`${formId}-full-name`}
            maxLength={120}
            name="fullName"
            required
            type="text"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-class`}>Turma</label>
          <input
            aria-readonly="true"
            id={`${formId}-class`}
            name="turma"
            readOnly
            type="text"
            value="6º ano 01"
          />
        </div>
      </div>

      <div className="evaluation-questions">
        {Array.from({ length: 10 }, (_, index) => {
          const questionNumber = index + 1;
          const questionId = `${formId}-question-${questionNumber}`;

          return (
            <div className="form-field question-field" key={questionId}>
              <label htmlFor={questionId}>Questão {questionNumber} *</label>
              <textarea
                id={questionId}
                maxLength={2000}
                name={`question${questionNumber}`}
                placeholder="Digite sua resposta."
                required
                rows={4}
              />
            </div>
          );
        })}
      </div>

      <div className="form-field">
        <label htmlFor={`${formId}-comments`}>
          Comentários <span className="field-optional">(opcional)</span>
        </label>
        <textarea
          id={`${formId}-comments`}
          maxLength={2000}
          name="comments"
          placeholder="Se desejar, registre aqui uma observação adicional."
          rows={5}
        />
      </div>

      <div className="honeypot" data-honeypot="true" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>
          Não preencha este campo
        </label>
        <input
          autoComplete="off"
          id={`${formId}-website`}
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <div className="evaluation-submit">
        <button
          className="action-link action-link--dark"
          disabled={status === "sending"}
          type="submit"
        >
          {status === "sending"
            ? "Enviando respostas"
            : "Enviar autoavaliação"}
        </button>

        <p
          aria-live="polite"
          className={`submission-message${
            status === "error" ? " submission-message--error" : ""
          }`}
          id={`${formId}-status`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "sending"
            ? "Enviando suas respostas..."
            : status === "error"
              ? "Não foi possível registrar sua resposta. Verifique sua conexão e tente novamente."
              : ""}
        </p>
      </div>

      <p className="evaluation-privacy">
        As respostas serão utilizadas exclusivamente para acompanhamento
        pedagógico e poderão ser consultadas apenas pelo professor responsável.
      </p>
    </form>
  );
}
