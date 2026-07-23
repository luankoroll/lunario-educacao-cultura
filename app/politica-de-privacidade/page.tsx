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
        intro="Informações provisórias sobre o tratamento de dados nos formulários do Lunário."
      />

      <article className="internal-content">
        <div className="page-shell prose-content">
          <p className="eyebrow">Versão provisória — julho de 2026</p>

          <section aria-labelledby="sobre-esta-versao">
            <h2 id="sobre-esta-versao">Sobre esta versão</h2>
            <p>
              Os formulários disponíveis atualmente são estruturas
              demonstrativas. A confirmação acontece somente no navegador e
              não há, nesta versão, integração externa para receber, transmitir
              ou armazenar as informações preenchidas.
            </p>
          </section>

          <section aria-labelledby="dados-previstos">
            <h2 id="dados-previstos">Dados previstos</h2>
            <p>
              Quando os formulários forem ativados, poderão solicitar nome,
              e-mail, telefone, instituição, atividade de interesse, assunto e
              conteúdo da mensagem, conforme a finalidade de cada página.
            </p>
          </section>

          <section aria-labelledby="finalidades-previstas">
            <h2 id="finalidades-previstas">Finalidades previstas</h2>
            <p>
              Os dados poderão ser usados para administrar inscrições,
              registrar manifestações de interesse, responder contatos,
              avaliar propostas e comunicar informações diretamente
              relacionadas à solicitação realizada.
            </p>
          </section>

          <section aria-labelledby="consentimento">
            <h2 id="consentimento">Consentimento e escolhas</h2>
            <p>
              Antes da confirmação local, cada formulário exige a concordância
              com esta política. A futura versão integrada deverá informar com
              clareza a base de tratamento aplicável, os campos indispensáveis
              e eventuais comunicações opcionais.
            </p>
          </section>

          <section aria-labelledby="retencao-compartilhamento">
            <h2 id="retencao-compartilhamento">
              Retenção e compartilhamento
            </h2>
            <p>
              Como não há integração externa ativa, os dados preenchidos não
              são retidos nem compartilhados pelo Lunário nesta versão. Antes
              da ativação definitiva, este texto deverá identificar os
              serviços utilizados, os prazos de conservação e as situações de
              compartilhamento estritamente necessárias.
            </p>
          </section>

          <section aria-labelledby="seguranca-direitos">
            <h2 id="seguranca-direitos">Segurança e direitos</h2>
            <p>
              A versão definitiva deverá adotar medidas proporcionais de
              segurança e oferecer um canal para dúvidas e solicitações sobre
              acesso, correção, eliminação ou outras providências aplicáveis
              aos dados pessoais.
            </p>
          </section>

          <section aria-labelledby="contato-privacidade">
            <h2 id="contato-privacidade">Contato sobre privacidade</h2>
            <p>
              O endereço responsável por solicitações de privacidade ainda
              será definido antes da ativação do recebimento de dados.
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
