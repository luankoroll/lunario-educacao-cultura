import type { Metadata } from "next";
import { FilterableCollection, type ExplorerItem } from "@/app/components/FilterableCollection";
import { PageIntro } from "@/app/components/InternalPage";
import { publicationItems } from "@/app/lib/content";

const publicationTypes = [
  "Livros",
  "Capítulos de livros",
  "Artigos",
  "Ensaios",
  "Materiais didáticos",
  "Produções artísticas",
];

const publicationYears = Array.from(
  new Set(publicationItems.map((publication) => publication.year)),
).sort((a, b) => Number(b) - Number(a));

const publications: ExplorerItem[] = [...publicationItems]
  .sort((a, b) => Number(b.year) - Number(a.year))
  .map((publication) => ({
    eyebrow: publication.type,
    title: publication.title,
    description: `Resumo: ${publication.description} Texto preparado para revisão e atualização editorial.`,
    meta: [
      `Ano: ${publication.year}`,
      `Referência bibliográfica: ${publication.title}. ${publication.source}, ${publication.year}. Dados editoriais editáveis.`,
      "Metadados, link externo e arquivo: campos editáveis, a incluir quando disponíveis.",
    ],
    href: `/producao-bibliografica/${publication.slug}`,
    label: "Ver publicação",
    attributes: {
      type: publication.type,
      year: publication.year,
    },
  }));

export const metadata: Metadata = {
  title: "Produção bibliográfica",
  description:
    "Livros, artigos, ensaios, materiais didáticos e outras publicações de autoria ou organização de Luan Koroll.",
  alternates: { canonical: "/producao-bibliografica" },
};

export default function BibliographicProductionPage() {
  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow="Acervo"
        title="Produção bibliográfica"
        intro="Livros, capítulos, artigos, ensaios acadêmicos, materiais didáticos e outras publicações de autoria ou organização de Luan Koroll."
      />

      <section className="internal-section" aria-labelledby="catalogo-title">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Publicações</p>
              <h2 id="catalogo-title">Catálogo por tipo e ano</h2>
            </div>
            <p>
              Pesquise por título ou refine a coleção. Referências, resumos,
              metadados e arquivos permanecem preparados para atualização.
            </p>
          </div>

          <FilterableCollection
            items={publications}
            filters={[
              {
                key: "type",
                label: "Tipo de publicação",
                options: publicationTypes,
              },
              {
                key: "year",
                label: "Ano",
                options: publicationYears,
              },
            ]}
            searchLabel="Buscar por título"
            emptyMessage="Nenhuma publicação corresponde à busca e aos filtros selecionados."
          />

          <aside className="section-note" aria-label="Nota sobre o acervo">
            <p>
              Os links externos e os arquivos digitais serão publicados em cada
              registro conforme a disponibilidade e as permissões de acesso.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
