export const EVALUATION_FORM = {
  slug: "avaliacao-caderno-6-01",
  title:
    "Avaliação do caderno de Língua Portuguesa | 6º ano 01 | 2º trimestre de 2025",
  shortTitle: "Avaliação do caderno de Língua Portuguesa",
  turma: "6º ano 01",
  periodo: "2º trimestre de 2025",
  publicPath: "/formularios/avaliacao-caderno-6-01",
  successPath: "/formularios/avaliacao-caderno-6-01/enviado",
} as const;

export const EVALUATION_QUESTIONS = Array.from(
  { length: 10 },
  (_, index) => ({
    id: `q${index + 1}`,
    label: `Questão ${index + 1}`,
  }),
);

export const RESPONSE_HEADERS = [
  "ID da resposta",
  "Data do envio",
  "Horário do envio",
  "Nome completo",
  "Turma",
  "Questão 1",
  "Questão 2",
  "Questão 3",
  "Questão 4",
  "Questão 5",
  "Questão 6",
  "Questão 7",
  "Questão 8",
  "Questão 9",
  "Questão 10",
  "Comentários",
] as const;

export const RESPONSE_COLUMN_COUNT = RESPONSE_HEADERS.length;
