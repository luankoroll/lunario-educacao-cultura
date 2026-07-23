import type { Metadata } from "next";
import { ActionLink } from "../../components/ActionLink";
import { EditableForm } from "../../components/EditableForm";
import { PageIntro } from "../../components/InternalPage";

export const metadata: Metadata = {
  title: "Participação em eventos",
  description:
    "Formulário provisório para participação em eventos e projetos culturais do Lunário.",
  alternates: { canonical: "/formularios/participacao-em-eventos" },
};

export default function ParticipacaoEmEventosPage() {
  return (
    <main className="internal-page" id="conteudo">
      <PageIntro
        backHref="/formularios"
        backLabel="Voltar aos formulários"
        eyebrow="Formulários"
        title="Participação em eventos"
        intro="Manifeste localmente seu interesse em eventos, encontros e projetos culturais do Lunário."
      />

      <section
        aria-labelledby="dados-para-participacao"
        className="internal-content"
      >
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Participação</p>
              <h2 id="dados-para-participacao">
                Dados para participação
              </h2>
            </div>
            <p>
              Selecione a atividade e indique como deseja participar. Datas,
              vagas e retorno definitivo dependerão da abertura do canal
              oficial de inscrições.
            </p>
          </div>

          <EditableForm variant="event" />

          <div className="section-action">
            <ActionLink href="/eventos-e-projetos" variant="text">
              Consultar agenda
            </ActionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
