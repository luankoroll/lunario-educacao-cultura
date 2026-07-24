"use client";

import { type FormEvent, useEffect, useId, useState } from "react";

type LoginStatus = "idle" | "sending" | "error";

export function AdminLoginForm() {
  const formId = useId();
  const [status, setStatus] = useState<LoginStatus>("idle");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/admin/sessao", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).then((response) => {
      if (response.ok) {
        window.location.replace("/admin/formularios/");
      }
    }).catch(() => {
      // A tela de acesso continua disponível se a sessão não puder ser verificada.
    });

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "sending") {
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    setStatus("sending");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim(),
          password: String(formData.get("password") ?? ""),
          website: String(formData.get("website") ?? ""),
        }),
      });

      if (response.ok) {
        window.location.replace("/admin/formularios/");
        return;
      }
    } catch {
      // A mensagem apresentada abaixo não revela detalhes da autenticação.
    }

    setStatus("error");
  }

  return (
    <form
      aria-busy={status === "sending"}
      aria-describedby={`${formId}-status`}
      className="admin-login-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="form-field">
        <label htmlFor={`${formId}-email`}>E-mail</label>
        <input
          autoCapitalize="none"
          autoComplete="username"
          id={`${formId}-email`}
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${formId}-password`}>Senha</label>
        <input
          autoComplete="current-password"
          id={`${formId}-password`}
          maxLength={256}
          name="password"
          required
          type="password"
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

      <button
        className="action-link action-link--dark admin-login-form__button"
        disabled={status === "sending"}
        type="submit"
      >
        {status === "sending" ? "Entrando..." : "Entrar"}
      </button>

      <p
        aria-live="polite"
        className="admin-auth-message"
        id={`${formId}-status`}
        role={status === "error" ? "alert" : "status"}
      >
        {status === "error"
          ? "Não foi possível entrar. Verifique suas credenciais e tente novamente."
          : ""}
      </p>
    </form>
  );
}
