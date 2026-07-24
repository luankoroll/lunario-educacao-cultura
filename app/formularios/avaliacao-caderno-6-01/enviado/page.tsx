import type { Metadata } from "next";
import { ActionLink } from "../../../components/ActionLink";

export const metadata: Metadata = {
  title: "Autoavaliação enviada",
  robots: {
    follow: false,
    index: false,
  },
};

export default function EvaluationSubmittedPage() {
  return (
    <main className="submission-page" id="conteudo">
      <section className="page-shell submission-card">
        <p className="eyebrow">Envio concluído</p>
        <h1>Autoavaliação enviada.</h1>
        <p className="submission-card__lead">
          Autoavaliação enviada. Sua resposta foi registrada.
        </p>
        <p>
          Obrigado por participar. Você já pode fechar esta página ou voltar
          ao início do Lunário.
        </p>
        <ActionLink href="/" variant="outline">
          Voltar ao início
        </ActionLink>
      </section>
    </main>
  );
}
