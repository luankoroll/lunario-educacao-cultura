"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

const FORM_API = "/api/admin/formularios/avaliacao-caderno-6-01";
const EXPORT_API =
  "/api/admin/formularios/avaliacao-caderno-6-01/exportar";
const PAGE_SIZE = 10;

type SortOption = "data_desc" | "data_asc" | "nome_asc" | "nome_desc";

type ResponseRecord = {
  id: string;
  date: string;
  time: string;
  fullName: string;
  turma: string;
  answers: string[];
  comments: string;
};

type ApiSummary = {
  titulo?: string;
  turma?: string;
  periodo?: string;
  totalRespostas?: number;
  ultimaResposta?: string | null;
  registrosEncontrados?: number;
};

type ApiPayload = {
  registros?: unknown[];
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  resumo?: ApiSummary;
};

type SessionPayload = {
  authenticated?: boolean;
  csrfToken?: string;
};

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function valueFrom(
  record: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function normalizeRecord(value: unknown): ResponseRecord {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const submittedAt = asText(
    valueFrom(record, "submittedAt", "submitted_at"),
  );
  const parsedDate = submittedAt ? new Date(submittedAt) : null;
  const isValidDate =
    parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime());
  const rawAnswers = valueFrom(record, "answers", "respostas");
  const answers = Array.isArray(rawAnswers)
    ? rawAnswers.map((answer) => asText(answer))
    : Array.from({ length: 10 }, (_, index) =>
        asText(
          valueFrom(
            record,
            `question${index + 1}`,
            `questao${index + 1}`,
            `q${index + 1}`,
          ),
        ),
      );

  return {
    id: asText(valueFrom(record, "id", "responseId", "response_id")),
    date:
      asText(valueFrom(record, "date", "data", "dataEnvio")) ||
      (isValidDate
        ? new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
          }).format(parsedDate)
        : "—"),
    time:
      asText(valueFrom(record, "time", "horario", "horarioEnvio")) ||
      (isValidDate
        ? new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(parsedDate)
        : "—"),
    fullName:
      asText(valueFrom(record, "fullName", "nomeCompleto", "nome")) ||
      "—",
    turma: asText(valueFrom(record, "turma")) || "—",
    answers: Array.from({ length: 10 }, (_, index) => answers[index] || "—"),
    comments:
      asText(valueFrom(record, "comments", "comentarios")) || "—",
  };
}

function formatRecentSubmission(value?: string | null) {
  if (!value) {
    return "Nenhuma resposta registrada";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AdminFormsDashboard() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [turma, setTurma] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState<SortOption>("data_desc");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<ApiPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/admin/sessao", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          window.location.replace("/admin/login/");
          return null;
        }

        return (await response.json()) as SessionPayload;
      })
      .then((session) => {
        if (!session) {
          return;
        }

        if (!session.authenticated || !session.csrfToken) {
          window.location.replace("/admin/login/");
          return;
        }

        setCsrfToken(session.csrfToken);
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!csrfToken) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(false);

      fetch(`${FORM_API}/consultar`, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          busca: search,
          turma,
          data: date,
          ordenacao: sort,
          pagina: page,
          limite: PAGE_SIZE,
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (response.status === 401 || response.status === 403) {
            window.location.replace("/admin/login/");
            return null;
          }

          if (!response.ok) {
            throw new Error("Falha ao consultar as respostas.");
          }

          return (await response.json()) as ApiPayload;
        })
        .then((data) => {
          if (data) {
            setPayload(data);
            setLoading(false);
          }
        })
        .catch((requestError: unknown) => {
          if (
            requestError instanceof DOMException &&
            requestError.name === "AbortError"
          ) {
            return;
          }

          setError(true);
          setLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [csrfToken, date, page, search, sort, turma]);

  const records = useMemo(
    () => (payload.registros ?? []).map(normalizeRecord),
    [payload.registros],
  );
  const summary = payload.resumo ?? {};
  const totalResponses =
    summary.totalRespostas ?? payload.total ?? 0;
  const found =
    summary.registrosEncontrados ?? payload.total ?? records.length;
  const currentPage = payload.pagina ?? page;
  const totalPages = Math.max(payload.totalPaginas ?? 1, 1);

  function updateFilter(
    setter: (value: string) => void,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setPage(1);
    setter(event.currentTarget.value);
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });
    } finally {
      window.location.replace("/admin/login/");
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <Link className="admin-wordmark" href="/">
          Lunário
        </Link>
        <div>
          <span>Painel do administrador</span>
          <button
            className="admin-logout"
            disabled={loggingOut}
            onClick={handleLogout}
            type="button"
          >
            {loggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </header>

      <main className="admin-main" id="conteudo">
        <div className="admin-title">
          <div>
            <p className="eyebrow">Formulários</p>
            <h1>Acompanhamento pedagógico</h1>
          </div>
          <p>
            Consulte e exporte as respostas registradas. Este espaço é
            reservado ao professor responsável.
          </p>
        </div>

        <section
          aria-labelledby="form-summary-title"
          className="admin-summary-card"
        >
          <div className="admin-summary-card__heading">
            <div>
              <p className="eyebrow">Formulário disponível</p>
              <h2 id="form-summary-title">
                {summary.titulo ??
                  "Avaliação do caderno de Língua Portuguesa"}
              </h2>
            </div>
            <div className="admin-summary-card__actions">
              <a
                className="action-link action-link--outline"
                href="#respostas"
              >
                Visualizar respostas
              </a>
              <a
                className="action-link action-link--outline"
                href={`${EXPORT_API}?formato=csv`}
              >
                Baixar CSV
              </a>
              <a
                className="action-link action-link--dark"
                href={`${EXPORT_API}?formato=xlsx`}
              >
                Baixar Excel
              </a>
            </div>
          </div>

          <dl className="admin-summary-list">
            <div>
              <dt>Turma</dt>
              <dd>{summary.turma ?? "6º ano 01"}</dd>
            </div>
            <div>
              <dt>Período</dt>
              <dd>{summary.periodo ?? "2º trimestre de 2025"}</dd>
            </div>
            <div>
              <dt>Total de respostas</dt>
              <dd>{totalResponses}</dd>
            </div>
            <div>
              <dt>Resposta mais recente</dt>
              <dd>{formatRecentSubmission(summary.ultimaResposta)}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="responses-title"
          className="admin-responses"
          id="respostas"
        >
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Consulta privada</p>
              <h2 id="responses-title">Respostas</h2>
            </div>
            <p aria-live="polite">
              {loading
                ? "Consultando registros..."
                : `${found} ${found === 1 ? "registro encontrado" : "registros encontrados"}`}
            </p>
          </div>

          <div className="admin-filters">
            <label className="search-field">
              Buscar pelo nome do estudante
              <input
                onChange={(event) => setSearchInput(event.currentTarget.value)}
                placeholder="Digite um nome"
                type="search"
                value={searchInput}
              />
            </label>

            <label className="select-field">
              Turma
              <select
                onChange={(event) => updateFilter(setTurma, event)}
                value={turma}
              >
                <option value="">Todas as turmas</option>
                <option value="6º ano 01">6º ano 01</option>
              </select>
            </label>

            <label className="search-field">
              Data do envio
              <input
                onChange={(event) => updateFilter(setDate, event)}
                type="date"
                value={date}
              />
            </label>

            <label className="select-field">
              Ordenar por
              <select
                onChange={(event) => {
                  setPage(1);
                  setSort(event.currentTarget.value as SortOption);
                }}
                value={sort}
              >
                <option value="data_desc">Data: mais recentes</option>
                <option value="data_asc">Data: mais antigas</option>
                <option value="nome_asc">Nome: A–Z</option>
                <option value="nome_desc">Nome: Z–A</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="admin-state" role="alert">
              <h3>Não foi possível carregar as respostas.</h3>
              <p>Atualize a página e tente novamente.</p>
            </div>
          ) : null}

          {!error ? (
            <div
              aria-busy={loading}
              className="admin-table-wrapper"
              tabIndex={0}
            >
              <table className="admin-table">
                <caption className="sr-only">
                  Respostas da avaliação do caderno de Língua Portuguesa
                </caption>
                <thead>
                  <tr>
                    <th scope="col">ID da resposta</th>
                    <th scope="col">Data do envio</th>
                    <th scope="col">Horário do envio</th>
                    <th scope="col">Nome completo</th>
                    <th scope="col">Turma</th>
                    {Array.from({ length: 10 }, (_, index) => (
                      <th scope="col" key={`question-heading-${index + 1}`}>
                        Questão {index + 1}
                      </th>
                    ))}
                    <th scope="col">Comentários</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && records.length === 0 ? (
                    <tr>
                      <td className="admin-table__empty" colSpan={16}>
                        Nenhuma resposta corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  ) : null}
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="admin-table__id">{record.id}</td>
                      <td>{record.date}</td>
                      <td>{record.time}</td>
                      <td className="admin-table__name">{record.fullName}</td>
                      <td>{record.turma}</td>
                      {record.answers.map((answer, index) => (
                        <td key={`${record.id}-answer-${index + 1}`}>
                          {answer}
                        </td>
                      ))}
                      <td>{record.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <nav className="admin-pagination" aria-label="Paginação">
            <button
              disabled={loading || currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Página anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={loading || currentPage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              type="button"
            >
              Próxima página
            </button>
          </nav>
        </section>
      </main>
    </div>
  );
}
