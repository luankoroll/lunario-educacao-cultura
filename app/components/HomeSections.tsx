import {
  courseItems,
  editorialItems,
  eventItems,
  formCards,
  publicationItems,
} from "../lib/content";
import { ActionLink } from "./ActionLink";
import { ContentSection, InfoCard } from "./InternalPage";

export function HomeSections() {
  return (
    <>
      <ContentSection
        id="editorial"
        eyebrow="Leitura e pensamento"
        title="Editorial"
        intro="Textos, ensaios, crônicas, materiais didáticos e reflexões sobre literatura, educação, cultura e linguagem."
        actionHref="/editorial"
        actionLabel="Ver todos os textos"
      >
        <div className="content-grid">
          {editorialItems.slice(0, 3).map((item) => (
            <InfoCard
              key={item.slug}
              eyebrow={item.category}
              title={item.title}
              description={item.summary}
              meta={[item.date]}
              href={`/editorial/${item.slug}`}
              label="Ler texto"
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection
        id="cursos"
        eyebrow="Formação"
        title="Cursos"
        intro="Cursos, oficinas e percursos formativos voltados à leitura, à escrita, à literatura, ao ensino e à produção cultural."
        actionHref="/cursos"
        actionLabel="Ver todos os cursos"
        tone="soft"
      >
        <div className="content-grid">
          {courseItems.slice(0, 3).map((course) => (
            <InfoCard
              key={course.slug}
              eyebrow={course.status}
              title={course.title}
              description={course.description}
              meta={[course.modality, course.duration, course.audience]}
              href={`/cursos/${course.slug}`}
              label="Saiba mais"
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection
        id="producao-bibliografica"
        eyebrow="Acervo"
        title="Produção bibliográfica"
        intro="Livros, capítulos, artigos, ensaios acadêmicos, materiais didáticos e outras publicações de autoria ou organização de Luan Koroll."
        actionHref="/producao-bibliografica"
        actionLabel="Ver toda a produção"
      >
        <div className="publication-grid">
          {publicationItems.slice(0, 3).map((publication, index) => (
            <InfoCard
              key={publication.slug}
              eyebrow={publication.type}
              title={publication.title}
              description={publication.description}
              meta={[publication.year, publication.source]}
              href={`/producao-bibliografica/${publication.slug}`}
              label="Ver publicação"
            >
              <div
                className={`publication-cover publication-cover--${index + 1}`}
                role="img"
                aria-label={`Capa provisória de ${publication.title}`}
              >
                <span>Lunário</span>
                <strong>{publication.title}</strong>
              </div>
            </InfoCard>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        id="eventos-projetos"
        eyebrow="Agenda"
        title="Eventos e projetos"
        intro="Agenda de encontros, saraus, cursos, projetos educacionais, ações culturais e atividades literárias."
        actionHref="/eventos-e-projetos"
        actionLabel="Ver agenda completa"
        tone="soft"
      >
        <div className="event-showcase">
          {eventItems.map((event) => (
            <article
              className={`agenda-card ${
                event.featured ? "agenda-card--featured" : ""
              }`}
              key={event.href}
            >
              <p className="content-card__eyebrow">{event.type}</p>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <ul className="meta-list">
                <li>{event.period}</li>
                <li>{event.location}</li>
              </ul>
              <ActionLink href={event.href} variant="text">
                Mais informações
              </ActionLink>
            </article>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        id="formularios"
        eyebrow="Participação"
        title="Formulários"
        intro="Inscrições, solicitações, envio de propostas, contatos e participação em atividades educacionais e culturais."
        actionHref="/formularios"
        actionLabel="Ver todos os formulários"
      >
        <div className="content-grid">
          {formCards.map((form) => (
            <InfoCard
              key={form.href}
              eyebrow="Formulário"
              title={form.title}
              description={form.description}
              href={form.href}
              label={form.label}
            />
          ))}
        </div>
      </ContentSection>
    </>
  );
}
