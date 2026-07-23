import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionLink } from "@/app/components/ActionLink";
import { PageIntro } from "@/app/components/InternalPage";
import { eventItems } from "@/app/lib/content";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

const projectPages = eventItems.filter((item) =>
  item.href.startsWith("/projetos/"),
);

export const dynamicParams = false;

export function generateStaticParams() {
  return projectPages.map((item) => ({
    slug: item.href.replace("/projetos/", ""),
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = projectPages.find(
    (project) => project.href === `/projetos/${slug}`,
  );

  return item
    ? {
        title: item.title,
        description: item.description,
        alternates: { canonical: item.href },
      }
    : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const listedProject = projectPages.find(
    (item) => item.href === `/projetos/${slug}`,
  );

  if (!listedProject) {
    notFound();
  }

  const title = listedProject.title;
  const type = listedProject.type;
  const period = listedProject.period;
  const location = listedProject.location;
  const description = listedProject.description;

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
