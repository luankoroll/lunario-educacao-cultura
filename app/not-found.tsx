import { ActionLink } from "./components/ActionLink";

export default function NotFound() {
  return (
    <main className="internal-page" id="conteudo">
      <section className="internal-hero" aria-labelledby="not-found-title">
        <div className="page-shell">
          <p className="eyebrow">Erro 404</p>
          <h1 id="not-found-title">Página não encontrada</h1>
          <p className="internal-hero__intro">
            O endereço informado não existe ou o conteúdo foi movido. Volte à
            página inicial para continuar navegando pelo Lunário.
          </p>
          <ActionLink href="/" variant="dark">
            Voltar ao início
          </ActionLink>
        </div>
      </section>
    </main>
  );
}
