import type { Metadata } from "next";
import { ActionLink } from "../components/ActionLink";
import { PageIntro } from "../components/InternalPage";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Informações sobre o tratamento de dados nos formulários do Lunário.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="internal-page" id="conteudo">
      <PageIntro
        eyebrow="Transparência"
        title="Política de privacidade"
        intro="Como o Lunário trata e protege as informações enviadas pelos formulários."
      />

      <article className="internal-content">
        <div className="page-shell prose-content">
          <p className="eyebrow">Atualizada em julho de 2026</p>

          <section aria-labelledby="sobre-esta-versao">
            <h2 id="sobre-esta-versao">Sobre os formulários</h2>
            <p>
              A autoavaliação do caderno de Língua Portuguesa recebe e
              armazena respostas para acompanhamento pedagógico. Os
              formulários de inscrições, participação e contato permanecem
              demonstrativos e não enviam seus campos a um serviço externo.
            </p>
          </section>

          <section aria-labelledby="dados-previstos">
            <h2 id="dados-previstos">Dados da autoavaliação</h2>
            <p>
              A autoavaliação registra o nome completo, a turma, as respostas
              às dez questões, comentários opcionais, um identificador único e
              a data e o horário do envio. Não são solicitados endereço,
              localização ou informações do dispositivo.
            </p>
          </section>

          <section aria-labelledby="finalidades-previstas">
            <h2 id="finalidades-previstas">Finalidade</h2>
            <p>
              As respostas são utilizadas exclusivamente para acompanhamento
              pedagógico da atividade correspondente e podem ser consultadas
              apenas pelo professor responsável.
            </p>
          </section>

          <section aria-labelledby="consentimento">
            <h2 id="consentimento">Participação e correção</h2>
            <p>
              Os campos obrigatórios estão identificados no formulário. O
              espaço de comentários é opcional. Solicitações de correção ou
              exclusão devem ser encaminhadas ao professor responsável pela
              atividade.
            </p>
          </section>

          <section aria-labelledby="retencao-compartilhamento">
            <h2 id="retencao-compartilhamento">
              Retenção e compartilhamento
            </h2>
            <p>
              As respostas ficam em um repositório privado do Google Sheets,
              acessível somente às pessoas autorizadas para o acompanhamento.
              Não são publicadas, vendidas ou utilizadas para publicidade.
              Elas devem ser mantidas somente pelo período necessário à
              atividade pedagógica e às obrigações aplicáveis.
            </p>
          </section>

          <section aria-labelledby="seguranca-direitos">
            <h2 id="seguranca-direitos">Segurança e direitos</h2>
            <p>
              O envio passa por uma rota protegida do servidor. O painel e os
              arquivos de exportação exigem autenticação, e as credenciais de
              integração não são enviadas ao navegador. O sistema aplica
              controles contra repetições e envios automatizados.
            </p>
          </section>

          <section aria-labelledby="contato-privacidade">
            <h2 id="contato-privacidade">Contato sobre privacidade</h2>
            <p>
              Dúvidas sobre as respostas da autoavaliação devem ser dirigidas
              ao professor responsável. Para outros assuntos relacionados ao
              Lunário, utilize o formulário de contato disponível no site.
            </p>
          </section>

          <div className="section-action">
            <ActionLink href="/formularios">
              Voltar aos formulários
            </ActionLink>
          </div>
        </div>
      </article>
    </main>
  );
}
