import { ActionLink } from "../../components/ActionLink";
import { EditableForm } from "../../components/EditableForm";
import { PageIntro } from "../../components/InternalPage";

export default function InscricaoEmCursosPage() {
  return (
    <main className="internal-page" id="conteudo">
      <PageIntro
        backHref="/formularios"
        backLabel="Voltar aos formulários"
        eyebrow="Formulários"
        title="Inscrição em cursos"
        intro="Registre localmente seu interesse nos cursos e oficinas disponíveis no Lunário."
      />

      <section
        aria-labelledby="dados-para-inscricao"
        className="internal-content"
      >
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inscrição</p>
              <h2 id="dados-para-inscricao">Dados para inscrição</h2>
            </div>
            <p>
              Preencha os campos obrigatórios. Informações sobre vagas,
              calendário e confirmação definitiva serão incluídas quando o
              canal de inscrição estiver ativo.
            </p>
          </div>

          <EditableForm variant="course" />

          <div className="section-action">
            <ActionLink href="/cursos" variant="text">
              Consultar cursos
            </ActionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
