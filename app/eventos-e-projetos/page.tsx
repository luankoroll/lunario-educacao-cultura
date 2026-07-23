import type { Metadata } from "next";
import { InfoCard, PageIntro } from "@/app/components/InternalPage";
import { eventItems } from "@/app/lib/content";

const upcomingEvents = eventItems
  .filter((item) => item.href.startsWith("/eventos/"))
  .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

const projects = eventItems.filter((item) =>
  item.href.startsWith("/projetos/"),
);

export const metadata: Metadata = {
  title: "Eventos e projetos",
  description:
    "Agenda de encontros, saraus, projetos educacionais, ações culturais e atividades literárias.",
  alternates: { canonical: "/eventos-e-projetos" },
};

export default function EventsAndProjectsPage() {
  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow="Agenda"
        title="Eventos e projetos"
        intro="Agenda de encontros, saraus, cursos, projetos educacionais, ações culturais e atividades literárias."
      />

      <section
        className="internal-section"
        aria-labelledby="proximos-eventos-title"
      >
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Agenda cultural</p>
              <h2 id="proximos-eventos-title">Próximos eventos</h2>
            </div>
            <p>
              Encontros futuros apresentados em ordem de destaque e data.
            </p>
          </div>

          <div className="content-grid content-grid--two">
            {upcomingEvents.map((event) => (
              <InfoCard
                key={event.href}
                eyebrow={event.type}
                title={event.title}
                description={event.description}
                meta={[
                  `Data: ${event.period}`,
                  `Local: ${event.location}`,
                ]}
                href={event.href}
                label="Mais informações"
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="internal-section internal-section--soft"
        aria-labelledby="projetos-title"
      >
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Iniciativas</p>
              <h2 id="projetos-title">Projetos</h2>
            </div>
            <p>
              Projetos continuados, ações em planejamento e registros de
              iniciativas concluídas.
            </p>
          </div>

          <div className="content-grid content-grid--two">
            {projects.map((project) => (
              <InfoCard
                key={project.href}
                eyebrow={project.type}
                title={project.title}
                description={project.description}
                meta={[
                  `Período: ${project.period}`,
                  `Local: ${project.location}`,
                ]}
                href={project.href}
                label="Conhecer projeto"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
