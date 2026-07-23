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

      <details className="event-card__details">
        <summary
          className="event-card__button"
          aria-label="Mais informações sobre a 2ª Bienal Internacional do Livro de Jaraguá do Sul"
        >
          Mais informações
          <span aria-hidden="true">+</span>
        </summary>
        <div className="event-card__more">
          <p>2ª Bienal Internacional do Livro</p>
          <dl>
            <div>
              <dt>Cidade</dt>
              <dd>Jaraguá do Sul</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>08 de agosto de 2026</dd>
            </div>
          </dl>
        </div>
      </details>
    </article>
  );
}
