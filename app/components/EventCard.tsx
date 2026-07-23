import { ActionLink } from "./ActionLink";

export function EventCard() {
  return (
    <article
      className="event-card"
      id="proximos-eventos"
      aria-labelledby="event-title"
    >
      <div
        className="event-card__image"
        role="img"
        aria-label="Livro aberto com monumento cultural em traço monocromático"
      />

      <div className="event-card__content">
        <p className="event-card__eyebrow">Próximos eventos</p>
        <h2 className="event-card__title" id="event-title">
          2ª Bienal Internacional do Livro de Jaraguá do Sul
        </h2>
        <div className="event-card__date">
          <span className="date-icon" aria-hidden="true">
            <span>08</span>
          </span>
          <time dateTime="2026-08-08">08 de agosto de 2026</time>
        </div>
      </div>

      <ActionLink
        className="event-card__button"
        href="/eventos/bienal-internacional-do-livro-2026"
        variant="outline"
      >
          Mais informações
      </ActionLink>
    </article>
  );
}
