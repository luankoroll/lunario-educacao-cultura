import { Brand } from "./Brand";
import { EventCard } from "./EventCard";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__frame">
        <header className="hero__header">
          <Brand />
        </header>

        <div className="hero__content">
          <EventCard />

          <div className="hero__copy">
            <h1 className="hero__title" id="hero-title">
              <span>Educação</span>
              <span>e Cultura</span>
            </h1>
            <p className="hero__subtitle">
              <span>Conhecimento que transforma.</span>
              <span>Cultura que conecta.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
