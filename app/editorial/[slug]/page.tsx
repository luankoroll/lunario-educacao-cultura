import type { Metadata } from "next";
import { ActionLink } from "../../components/ActionLink";
import { PageIntro } from "../../components/InternalPage";
import { editorialItems } from "../../lib/content";

type EditorialTextPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return editorialItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: EditorialTextPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = editorialItems.find((entry) => entry.slug === slug);

  return item
    ? {
        title: item.title,
        description: item.summary,
        alternates: { canonical: `/editorial/${item.slug}` },
      }
    : {};
}

export default async function EditorialTextPage({
  params,
}: EditorialTextPageProps) {
  const { slug } = await params;
  const item = editorialItems.find((entry) => entry.slug === slug);

  if (!item) {
    return null;
  }

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow={`${item.category} · ${item.date}`}
        title={item.title}
        intro={item.summary}
        backHref="/editorial"
        backLabel="Voltar ao editorial"
      />

      <section className="internal-section" aria-label="Texto editorial">
        <div className="page-shell">
          <article className="prose">
            <p>
              Este espaço está preparado para receber a íntegra do texto,
              referências, imagens e informações de autoria. O conteúdo
              editorial poderá ser atualizado sem alterar a estrutura da
              página.
            </p>
            <p>
              Nesta versão inicial, a apresentação funciona como uma leitura
              demonstrativa e sinaliza com clareza onde o texto completo será
              publicado.
            </p>
            <ActionLink href="/editorial" variant="text">
              Ver todos os textos
            </ActionLink>
          </article>
        </div>
      </section>
    </main>
  );
}
