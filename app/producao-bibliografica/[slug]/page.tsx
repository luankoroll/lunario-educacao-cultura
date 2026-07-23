import type { Metadata } from "next";
import { ActionLink } from "../../components/ActionLink";
import { PageIntro } from "../../components/InternalPage";
import { publicationItems } from "../../lib/content";

type PublicationPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicationItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PublicationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = publicationItems.find((entry) => entry.slug === slug);

  return item
    ? {
        title: item.title,
        description: item.description,
        alternates: {
          canonical: `/producao-bibliografica/${item.slug}`,
        },
      }
    : {};
}

export default async function PublicationPage({
  params,
}: PublicationPageProps) {
  const { slug } = await params;
  const item = publicationItems.find((entry) => entry.slug === slug);

  if (!item) {
    return null;
  }

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow={`${item.type} · ${item.year}`}
        title={item.title}
        intro={item.description}
        backHref="/producao-bibliografica"
        backLabel="Voltar à produção bibliográfica"
      />

      <section
        className="internal-section"
        aria-labelledby="publication-reference-title"
      >
        <div className="page-shell detail-layout">
          <article className="detail-main prose">
            <h2 id="publication-reference-title">Resumo</h2>
            <p>{item.description}</p>
            <p>
              O resumo ampliado, os metadados completos e os links de acesso
              poderão ser inseridos aqui quando a publicação estiver
              disponível.
            </p>
          </article>

          <aside className="detail-sidebar">
            <p className="eyebrow">Referência provisória</p>
            <p>
              {item.title}. {item.source}, {item.year}.
            </p>
            <p className="editable-note">
              Link externo e arquivo ainda serão incluídos.
            </p>
            <ActionLink href="/formularios/contato" variant="outline">
              Solicitar informações
            </ActionLink>
          </aside>
        </div>
      </section>
    </main>
  );
}
