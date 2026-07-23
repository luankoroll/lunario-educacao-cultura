"use client";

import { useMemo, useState } from "react";

export type ExplorerItem = {
  eyebrow: string;
  title: string;
  description: string;
  meta: string[];
  href: string;
  label: string;
  attributes: Record<string, string>;
};

export type ExplorerFilter = {
  key: string;
  label: string;
  options: string[];
};

type FilterableCollectionProps = {
  items: ExplorerItem[];
  filters: ExplorerFilter[];
  searchLabel: string;
  emptyMessage?: string;
  pageSize?: number;
};

export function FilterableCollection({
  items,
  filters,
  searchLabel,
  emptyMessage = "Nenhum conteúdo encontrado com estes filtros.",
  pageSize = 4,
}: FilterableCollectionProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const matchesQuery =
        !normalized ||
        `${item.title} ${item.description} ${item.eyebrow}`
          .toLocaleLowerCase("pt-BR")
          .includes(normalized);
      const matchesFilters = filters.every((filter) => {
        const value = selected[filter.key];
        return !value || item.attributes[filter.key] === value;
      });
      return matchesQuery && matchesFilters;
    });
  }, [filters, items, query, selected]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleItems = filteredItems.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function updateFilter(key: string, value: string) {
    setSelected((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  return (
    <section className="explorer" aria-label="Explorar conteúdos">
      <div className="filter-bar">
        <label className="search-field">
          <span>{searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Digite para buscar"
          />
        </label>
        {filters.map((filter) => (
          <label className="select-field" key={filter.key}>
            <span>{filter.label}</span>
            <select
              value={selected[filter.key] ?? ""}
              onChange={(event) => updateFilter(filter.key, event.target.value)}
            >
              <option value="">Todos</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {visibleItems.length ? (
        <div className="content-grid content-grid--two">
          {visibleItems.map((item) => (
            <article className="content-card" key={item.href}>
              <p className="content-card__eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <ul className="meta-list" aria-label="Informações">
                {item.meta.map((meta) => (
                  <li key={meta}>{meta}</li>
                ))}
              </ul>
              <a className="action-link action-link--text" href={item.href}>
                <span>{item.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state" role="status">
          {emptyMessage}
        </p>
      )}

      {pageCount > 1 ? (
        <nav className="pagination" aria-label="Paginação">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage === 1}
          >
            Anterior
          </button>
          <span>
            Página {safePage} de {pageCount}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
            disabled={safePage === pageCount}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </section>
  );
}
