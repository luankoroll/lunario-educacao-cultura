import type { Metadata } from "next";
import { EvaluationForm } from "../../components/EvaluationForm";
import { PageIntro } from "../../components/InternalPage";

export const metadata: Metadata = {
  title: "Avaliação do caderno de Língua Portuguesa",
  description:
    "Autoavaliação do caderno de Língua Portuguesa do 6º ano 01, referente ao 2º trimestre de 2025.",
  alternates: {
    canonical: "/formularios/avaliacao-caderno-6-01",
  },
};

export default function EvaluationPage() {
  return (
    <main className="internal-page" id="conteudo">
      <PageIntro
        backHref="/formularios"
        backLabel="Voltar aos formulários"
        eyebrow="Autoavaliação · 6º ano 01"
        intro="Leia cada questão com atenção e registre sua resposta antes de enviar."
        title="Avaliação do caderno de Língua Portuguesa"
      />

      <section className="internal-section">
        <div className="page-shell evaluation-page">
          <div className="evaluation-heading">
            <div>
              <p className="eyebrow">2º trimestre de 2025</p>
              <h2>Suas respostas</h2>
            </div>
            <p>
              O envio é feito por uma conexão segura. Depois da confirmação,
              suas respostas serão encaminhadas ao acompanhamento pedagógico.
            </p>
          </div>
          <EvaluationForm />
        </div>
      </section>
    </main>
  );
}
