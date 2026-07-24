import { EVALUATION_FORM } from "../../shared/form-definition";
import type { ResponseRow } from "./google-sheets";
import type { AdminFilters } from "./security";

function dateToIso(date: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function normalizedSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function timestampKey(row: ResponseRow) {
  return `${dateToIso(row[1])}T${row[2]}`;
}

export function queryResponseRows(
  rows: ResponseRow[],
  filters: AdminFilters,
) {
  const search = normalizedSearch(filters.busca);
  const filtered = rows.filter((row) => {
    if (search && !normalizedSearch(row[3]).includes(search)) {
      return false;
    }
    if (filters.turma && row[4] !== filters.turma) {
      return false;
    }
    if (filters.data && dateToIso(row[1]) !== filters.data) {
      return false;
    }
    return true;
  });

  const collator = new Intl.Collator("pt-BR", {
    sensitivity: "base",
    numeric: true,
  });
  filtered.sort((left, right) => {
    if (filters.ordenacao === "nome_asc") {
      return collator.compare(left[3], right[3]);
    }
    if (filters.ordenacao === "nome_desc") {
      return collator.compare(right[3], left[3]);
    }
    const comparison = timestampKey(left).localeCompare(timestampKey(right));
    return filters.ordenacao === "data_asc" ? comparison : -comparison;
  });

  const total = filtered.length;
  const totalPaginas = Math.max(Math.ceil(total / filters.limite), 1);
  const pagina = Math.min(filters.pagina, totalPaginas);
  const offset = (pagina - 1) * filters.limite;
  const registros = filtered
    .slice(offset, offset + filters.limite)
    .map((row) => ({
      id: row[0],
      date: row[1],
      time: row[2],
      fullName: row[3],
      turma: row[4],
      answers: row.slice(5, 15),
      comments: row[15],
    }));

  const latest = rows.reduce<ResponseRow | null>((current, row) => {
    if (!current || timestampKey(row) > timestampKey(current)) {
      return row;
    }
    return current;
  }, null);
  const latestDateIso = latest ? dateToIso(latest[1]) : "";
  const latestLocalIso =
    latest && latestDateIso
      ? `${latestDateIso}T${latest[2]}-03:00`
      : null;

  return {
    registros,
    total,
    pagina,
    totalPaginas,
    resumo: {
      titulo: EVALUATION_FORM.shortTitle,
      turma: EVALUATION_FORM.turma,
      periodo: EVALUATION_FORM.periodo,
      totalRespostas: rows.length,
      ultimaResposta: latestLocalIso,
      registrosEncontrados: total,
    },
  };
}
