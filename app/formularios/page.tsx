import { InfoCard, PageIntro } from "../components/InternalPage";
import { formCards } from "../lib/content";

export default function FormulariosPage() {
  return (
    <main className="internal-page" id="conteudo">
      <PageIntro
        eyebrow="Participação"
        title="Formulários"
        intro="Inscrições, solicitações, envio de propostas, contatos e participação em atividades educacionais e culturais."
      />

      <section
        aria-labelledby="formularios-disponiveis"
        className="internal-content"
      >
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Acessos</p>
              <h2 id="formularios-disponiveis">
                Formulários disponíveis
              </h2>
            </div>
            <p>
              Escolha o formulário adequado. Todas as estruturas desta versão
              são provisórias e podem ser editadas antes da integração com um
              serviço de recebimento.
            </p>
          </div>

          <div className="content-grid content-grid--three">
            {formCards.map((card) => (
              <InfoCard
                description={card.description}
                eyebrow="Formulário"
                href={card.href}
                key={card.href}
                label={card.label}
                title={card.title}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
