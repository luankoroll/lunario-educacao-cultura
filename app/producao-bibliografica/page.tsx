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
    href: `/formularios/contato?assunto=publicacao&titulo=${encodeURIComponent(publication.title)}`,
    label: "Solicitar acesso",
    attributes: {
      type: publication.type,
      year: publication.year,
    },
  }));

type BibliographicProductionPageProps = {
  searchParams: Promise<{ publicacao?: string | string[] }>;
};

export default async function BibliographicProductionPage({
  searchParams,
}: BibliographicProductionPageProps) {
  const { publicacao } = await searchParams;
  const selectedSlug = Array.isArray(publicacao)
    ? publicacao[0]
    : publicacao;
  const selectedPublication = publicationItems.find(
    (item) => item.slug === selectedSlug,
  );

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow="Acervo"
        title="Produção bibliográfica"
        intro="Livros, capítulos, artigos, ensaios acadêmicos, materiais didáticos e outras publicações de autoria ou organização de Luan Koroll."
      />

      {selectedPublication ? (
        <section
          className="internal-section internal-section--soft"
          id="publicacao"
          aria-labelledby="selected-publication-title"
        >
          <div className="page-shell detail-layout">
            <article className="detail-main">
              <p className="eyebrow">{selectedPublication.type}</p>
              <h2 id="selected-publication-title">
                {selectedPublication.title}
              </h2>
              <p>{selectedPublication.description}</p>
              <p className="section-note">
                O resumo ampliado, os metadados completos e os links de acesso
                poderão ser inseridos aqui quando a publicação estiver
                disponível.
              </p>
            </article>
            <aside className="detail-sidebar">
              <p className="eyebrow">Referência provisória</p>
              <p>
                {selectedPublication.title}. {selectedPublication.source},{" "}
                {selectedPublication.year}.
              </p>
              <p className="editable-note">
                Link externo e arquivo ainda serão incluídos.
              </p>
            </aside>
          </div>
        </section>
      ) : null}

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
