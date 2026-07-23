"use client";

import { type FormEvent, useId, useState } from "react";

type EditableFormVariant = "course" | "event" | "contact";

type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  pattern?: string;
  options?: string[];
  placeholder?: string;
  fullWidth?: boolean;
};

type EditableFormProps = {
  variant: EditableFormVariant;
};

const fieldsByVariant: Record<EditableFormVariant, FormField[]> = {
  course: [
    {
      name: "fullName",
      label: "Nome completo",
      type: "text",
      required: true,
      autoComplete: "name",
      minLength: 2,
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      required: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      required: true,
      autoComplete: "tel",
      pattern: "[0-9() +.-]{8,20}",
      placeholder: "(00) 00000-0000",
    },
    {
      name: "course",
      label: "Curso ou oficina de interesse",
      type: "select",
      required: true,
      options: [
        "Oficina de escrita literária",
        "Leitura e mediação cultural",
        "Literatura na escola",
        "Crônica: olhar, memória e cidade",
        "Produção cultural em pequena escala",
        "Laboratório de leitura crítica",
      ],
    },
    {
      name: "message",
      label: "Observações",
      type: "textarea",
      placeholder:
        "Compartilhe informações de acessibilidade, disponibilidade ou outras observações.",
      fullWidth: true,
    },
  ],
  event: [
    {
      name: "fullName",
      label: "Nome completo",
      type: "text",
      required: true,
      autoComplete: "name",
      minLength: 2,
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      required: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      required: true,
      autoComplete: "tel",
      pattern: "[0-9() +.-]{8,20}",
      placeholder: "(00) 00000-0000",
    },
    {
      name: "event",
      label: "Evento ou projeto de interesse",
      type: "select",
      required: true,
      options: [
        "2ª Bienal Internacional do Livro de Jaraguá do Sul",
        "Sarau Lunário",
        "Círculo de leitura",
        "Outro evento ou projeto",
      ],
    },
    {
      name: "participation",
      label: "Como deseja participar?",
      type: "select",
      required: true,
      options: [
        "Inscrição como participante",
        "Manifestação de interesse",
        "Proposta de atividade ou parceria",
      ],
    },
    {
      name: "message",
      label: "Mensagem",
      type: "textarea",
      placeholder:
        "Conte brevemente como gostaria de participar ou do que precisa.",
      fullWidth: true,
    },
  ],
  contact: [
    {
      name: "fullName",
      label: "Nome completo",
      type: "text",
      required: true,
      autoComplete: "name",
      minLength: 2,
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      required: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      autoComplete: "tel",
      pattern: "[0-9() +.-]{8,20}",
      placeholder: "(00) 00000-0000",
    },
    {
      name: "organization",
      label: "Instituição ou organização",
      type: "text",
      autoComplete: "organization",
    },
    {
      name: "subject",
      label: "Assunto",
      type: "select",
      required: true,
      options: [
        "Convite",
        "Proposta de parceria",
        "Solicitação profissional",
        "Dúvida ou informação",
        "Outro assunto",
      ],
    },
    {
      name: "message",
      label: "Mensagem",
      type: "textarea",
      required: true,
      minLength: 10,
      placeholder: "Escreva sua mensagem com as informações necessárias.",
      fullWidth: true,
    },
  ],
};

const copyByVariant: Record<
  EditableFormVariant,
  { label: string; submitLabel: string }
> = {
  course: {
    label: "Formulário provisório de inscrição em cursos",
    submitLabel: "Confirmar inscrição",
  },
  event: {
    label: "Formulário provisório de participação em eventos",
    submitLabel: "Confirmar interesse",
  },
  contact: {
    label: "Formulário provisório de contato e propostas",
    submitLabel: "Confirmar mensagem",
  },
};

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function getValidationMessage(field: FormField, control: FormControl) {
  if (control.validity.valueMissing) {
    return `Preencha o campo “${field.label}”.`;
  }

  if (control.validity.typeMismatch) {
    return "Informe um endereço de e-mail válido.";
  }

  if (control.validity.patternMismatch) {
    return "Informe um telefone válido, com DDD.";
  }

  if (control.validity.tooShort) {
    return `Use pelo menos ${field.minLength} caracteres neste campo.`;
  }

  return "";
}

export function EditableForm({ variant }: EditableFormProps) {
  const formId = useId();
  const fields = fieldsByVariant[variant];
  const copy = copyByVariant[variant];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function clearFieldError(name: string) {
    setSubmitted(false);
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validateField(field: FormField, control: FormControl) {
    const message = getValidationMessage(field, control);

    setErrors((current) => {
      const next = { ...current };
      if (message) {
        next[field.name] = message;
      } else {
        delete next[field.name];
      }
      return next;
    });

    return message;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const control = form.elements.namedItem(field.name);
      if (
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement
      ) {
        const message = getValidationMessage(field, control);
        if (message) {
          nextErrors[field.name] = message;
        }
      }
    }

    const privacy = form.elements.namedItem("privacy");
    if (privacy instanceof HTMLInputElement && !privacy.checked) {
      nextErrors.privacy =
        "Confirme que leu e concorda com a política de privacidade.";
    }

    setErrors(nextErrors);
    setSubmitted(false);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const honeypot = form.elements.namedItem("website");
    if (honeypot instanceof HTMLInputElement && honeypot.value.trim()) {
      form.reset();
      setSubmitted(true);
      return;
    }

    form.reset();
    setSubmitted(true);
  }

  return (
    <div className="editable-form">
      <p className="editable-form__notice" id={`${formId}-notice`}>
        Esta é uma estrutura provisória. O envio é confirmado apenas nesta
        página e ainda não está integrado a um serviço externo de recebimento
        ou armazenamento.
      </p>

      <form
        aria-label={copy.label}
        aria-describedby={`${formId}-notice`}
        noValidate
        onSubmit={handleSubmit}
      >
        <p className="form-required-note">
          Campos marcados com * são obrigatórios.
        </p>

        {Object.keys(errors).length ? (
          <p className="form-error-summary" role="alert">
            Revise os campos indicados antes de continuar.
          </p>
        ) : null}

        <div className="form-grid">
          {fields.map((field) => {
            const controlId = `${formId}-${field.name}`;
            const errorId = `${controlId}-error`;
            const sharedProps = {
              id: controlId,
              name: field.name,
              required: field.required,
              "aria-invalid": Boolean(errors[field.name]),
              "aria-describedby": errors[field.name] ? errorId : undefined,
              onChange: () => clearFieldError(field.name),
            };

            return (
              <div
                className={`form-field${field.fullWidth ? " form-field--full" : ""}`}
                key={field.name}
              >
                <label htmlFor={controlId}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>

                {field.type === "select" ? (
                  <select
                    {...sharedProps}
                    defaultValue=""
                    onBlur={(event) =>
                      validateField(field, event.currentTarget)
                    }
                  >
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    {...sharedProps}
                    minLength={field.minLength}
                    placeholder={field.placeholder}
                    rows={6}
                    onBlur={(event) =>
                      validateField(field, event.currentTarget)
                    }
                  />
                ) : (
                  <input
                    {...sharedProps}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    minLength={field.minLength}
                    pattern={field.pattern}
                    placeholder={field.placeholder}
                    onBlur={(event) =>
                      validateField(field, event.currentTarget)
                    }
                  />
                )}

                {errors[field.name] ? (
                  <p className="form-error" id={errorId}>
                    {errors[field.name]}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          style={{
            height: 1,
            left: -10000,
            overflow: "hidden",
            position: "absolute",
            width: 1,
          }}
        >
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

        <div className="privacy-field">
          <input
            aria-describedby={
              errors.privacy ? `${formId}-privacy-error` : undefined
            }
            aria-invalid={Boolean(errors.privacy)}
            id={`${formId}-privacy`}
            name="privacy"
            onChange={() => clearFieldError("privacy")}
            required
            type="checkbox"
          />
          <label htmlFor={`${formId}-privacy`}>
            Li e concordo com a{" "}
            <a href="/politica-de-privacidade">
              política de privacidade
            </a>
            . *
          </label>
          {errors.privacy ? (
            <p className="form-error" id={`${formId}-privacy-error`}>
              {errors.privacy}
            </p>
          ) : null}
        </div>

        <div className="form-actions">
          <button
            className="action-link action-link--dark"
            type="submit"
          >
            <span>{copy.submitLabel}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {submitted ? (
        <div
          aria-live="polite"
          className="form-confirmation"
          role="status"
        >
          <h2>Confirmação local concluída</h2>
          <p>
            Os campos foram validados nesta página. Como esta versão ainda não
            possui integração externa, nenhuma informação foi enviada ou
            armazenada.
          </p>
        </div>
      ) : null}
    </div>
  );
}
