import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionLink } from "@/app/components/ActionLink";
import { PageIntro } from "@/app/components/InternalPage";
import { eventItems } from "@/app/lib/content";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

const eventPages = eventItems.filter((item) =>
  item.href.startsWith("/eventos/"),
);

export const dynamicParams = false;

export function generateStaticParams() {
  return eventPages.map((item) => ({
    slug: item.href.replace("/eventos/", ""),
  }));
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = eventPages.find(
    (event) => event.href === `/eventos/${slug}`,
  );

  return item
    ? {
        title: item.title,
        description: item.description,
        alternates: { canonical: item.href },
      }
    : {};
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const isBookFair = slug === "bienal-internacional-do-livro-2026";
  const listedEvent = eventPages.find(
    (item) => item.href === `/eventos/${slug}`,
  );

  if (!listedEvent) {
    notFound();
  }

  const event = {
    title: listedEvent.title,
    type: listedEvent.type,
    date: isBookFair ? "08/08/2026" : listedEvent.period,
    dateTime: isBookFair ? "2026-08-08" : undefined,
    location: listedEvent.location,
    description: listedEvent.description,
  };

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow={event.type}
        title={event.title}
        intro={event.description}
        backHref="/eventos-e-projetos"
        backLabel="Voltar à agenda"
      />

      <section
        className="internal-section"
        aria-labelledby="informacoes-evento-title"
      >
        <div className="page-shell">
          <div className="detail-grid">
            <div
              className="event-placeholder"
              role="img"
              aria-label={`Espaço reservado para a imagem de ${event.title}`}
            >
              <span>Imagem do evento</span>
            </div>

            <article className="detail-panel">
              <p className="eyebrow">Informações essenciais</p>
              <h2 id="informacoes-evento-title">Sobre o evento</h2>
              <p>{event.description}</p>

              <dl className="detail-list">
                <div>
                  <dt>Data</dt>
                  <dd>
                    {event.dateTime ? (
                      <time dateTime={event.dateTime}>{event.date}</time>
                    ) : (
                      event.date
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Local</dt>
                  <dd>
                    {event.location}{" "}
                    <span className="editable-note">(conteúdo editável)</span>
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          <section
            className="detail-panel detail-panel--wide"
            aria-labelledby="programacao-title"
          >
            <p className="eyebrow">Atividades</p>
            <h2 id="programacao-title">Programação</h2>
            <p>
              A programação está em elaboração. Este espaço permanece editável
              para receber horários, participantes, mesas, oficinas e demais
              atividades.
            </p>
          </section>

          <div className="detail-actions">
            <ActionLink
              href="/formularios/participacao-em-eventos"
              variant="dark"
            >
              Fazer inscrição
            </ActionLink>
            <ActionLink href="/eventos-e-projetos" variant="text">
              Voltar à agenda
            </ActionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
