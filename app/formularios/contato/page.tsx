import { ActionLink } from "../../components/ActionLink";
import { EditableForm } from "../../components/EditableForm";
import { PageIntro } from "../../components/InternalPage";

export default function ContatoPage() {
  return (
    <main className="internal-page" id="conteudo">
      <PageIntro
        backHref="/formularios"
        backLabel="Voltar aos formulários"
        eyebrow="Formulários"
        title="Contato e propostas"
        intro="Espaço provisório para mensagens, convites, propostas de parceria e solicitações profissionais."
      />

      <section
        aria-labelledby="dados-para-contato"
        className="internal-content"
      >
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Contato</p>
              <h2 id="dados-para-contato">Escreva sua mensagem</h2>
            </div>
            <p>
              Inclua o contexto, a finalidade do contato e, quando houver,
              prazos relevantes. O recebimento externo será ativado em uma
              etapa posterior.
            </p>
          </div>

          <EditableForm variant="contact" />

          <div className="section-action">
            <ActionLink href="/formularios" variant="text">
              Ver todos os formulários
            </ActionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
