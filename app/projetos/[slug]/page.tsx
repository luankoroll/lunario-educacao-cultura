import { ActionLink } from "@/app/components/ActionLink";
import { PageIntro } from "@/app/components/InternalPage";
import { eventItems } from "@/app/lib/content";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

function titleFromSlug(slug: string) {
  return decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
    .join(" ");
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const listedProject = eventItems.find(
    (item) => item.href === `/projetos/${slug}`,
  );
  const title = listedProject?.title ?? titleFromSlug(slug);
  const type = listedProject?.type ?? "Projeto cultural";
  const period = listedProject?.period ?? "Período editável";
  const location =
    listedProject?.location ?? "Local em definição — informação editável";
  const description =
    listedProject?.description ??
    "Página provisória preparada para receber objetivos, histórico, equipe e registros deste projeto.";

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow={type}
        title={title}
        intro={description}
        backHref="/eventos-e-projetos"
        backLabel="Voltar aos eventos e projetos"
      />

      <section
        className="internal-section"
        aria-labelledby="sobre-projeto-title"
      >
        <div className="page-shell">
          <div className="detail-grid">
            <article className="detail-panel">
              <p className="eyebrow">Apresentação</p>
              <h2 id="sobre-projeto-title">Sobre o projeto</h2>
              <p>{description}</p>
              <p>
                Este conteúdo é provisório e poderá receber objetivos, equipe,
                parceiros, resultados e uma galeria de registros.
              </p>
            </article>

            <aside className="detail-panel" aria-label="Dados do projeto">
              <p className="eyebrow">Ficha do projeto</p>
              <h2>Informações</h2>
              <dl className="detail-list">
                <div>
                  <dt>Situação</dt>
                  <dd>{period}</dd>
                </div>
                <div>
                  <dt>Local</dt>
                  <dd>{location}</dd>
                </div>
                <div>
                  <dt>Atualização</dt>
                  <dd>Informações editáveis</dd>
                </div>
              </dl>
            </aside>
          </div>

          <div className="detail-actions">
            <ActionLink href="/formularios/contato" variant="dark">
              Manifestar interesse
            </ActionLink>
            <ActionLink href="/eventos-e-projetos" variant="text">
              Voltar aos eventos e projetos
            </ActionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
