import { ActionLink } from "../../components/ActionLink";
import { PageIntro } from "../../components/InternalPage";
import { courseItems } from "../../lib/content";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

type CourseDetails = {
  program: string[];
  certification: string;
};

const courseDetails: Record<string, CourseDetails> = {
  "oficina-de-escrita-literaria": {
    program: [
      "Observação, memória e criação de repertório",
      "Personagem, voz e ponto de vista",
      "Ritmo, cena e construção de textos breves",
      "Leitura compartilhada, revisão e reescrita",
    ],
    certification:
      "Certificado de participação para quem cumprir ao menos 75% da carga horária.",
  },
  "leitura-e-mediacao-cultural": {
    program: [
      "Mediação de leitura como prática de escuta",
      "Curadoria e criação de percursos leitores",
      "Estratégias para encontros presenciais e digitais",
      "Planejamento de uma ação de mediação cultural",
    ],
    certification:
      "Certificado de conclusão mediante participação nas atividades e entrega do plano final.",
  },
  "literatura-na-escola": {
    program: [
      "Literatura, experiência e formação leitora",
      "Critérios para seleção e organização de acervos",
      "Rodas de leitura, conversa literária e autoria",
      "Planejamento de sequências e projetos de leitura",
    ],
    certification:
      "Certificado digital de conclusão para participantes com aproveitamento nas atividades propostas.",
  },
  "cronica-olhar-memoria-e-cidade": {
    program: [
      "A crônica e suas formas contemporâneas",
      "O cotidiano como matéria de escrita",
      "Memória, observação e construção da cena",
      "Edição e compartilhamento de uma crônica autoral",
    ],
    certification:
      "Certificado digital de participação para quem concluir o percurso de escrita.",
  },
  "producao-cultural-em-pequena-escala": {
    program: [
      "Ideia, propósito e desenho de uma iniciativa cultural",
      "Públicos, parcerias e redes de colaboração",
      "Cronograma, orçamento e organização da produção",
      "Comunicação, registro e avaliação de resultados",
    ],
    certification:
      "Certificado de conclusão mediante participação e apresentação de um plano de ação.",
  },
  "laboratorio-de-leitura-critica": {
    program: [
      "Leitura atenta, contexto e formulação de perguntas",
      "Argumentação, evidências e interpretação",
      "Diálogo entre textos, linguagens e repertórios",
      "Escrita de notas e comentários críticos",
    ],
    certification:
      "Certificado de participação para quem cumprir ao menos 75% da carga horária.",
  },
};

export function generateStaticParams() {
  return courseItems.map((course) => ({ slug: course.slug }));
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = courseItems.find((item) => item.slug === slug);

  if (!course) {
    return (
      <main id="conteudo" className="internal-page">
        <PageIntro
          eyebrow="Cursos"
          title="Curso não encontrado"
          intro="O curso informado não está disponível. Consulte a página de cursos para conhecer os percursos formativos atuais."
          backHref="/cursos"
          backLabel="Ver todos os cursos"
        />
      </main>
    );
  }

  const details = courseDetails[course.slug] ?? {
    program: [
      "Apresentação dos fundamentos do percurso",
      "Práticas orientadas e repertório",
      "Desenvolvimento de uma atividade autoral",
      "Compartilhamento e avaliação do processo",
    ],
    certification:
      "Certificação disponibilizada conforme os critérios de participação do curso.",
  };

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow={`Cursos · ${course.status}`}
        title={course.title}
        intro={course.description}
        backHref="/cursos"
        backLabel="Voltar aos cursos"
      />

      <section className="internal-section" aria-labelledby="program-title">
        <div className="page-shell detail-layout">
          <article className="detail-main">
            <p className="eyebrow">Programa</p>
            <h2 id="program-title">O que você vai encontrar</h2>
            <ol className="program-list">
              {details.program.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ol>
          </article>

          <aside className="detail-sidebar" aria-labelledby="course-info-title">
            <p className="eyebrow">Informações</p>
            <h2 id="course-info-title">Sobre o curso</h2>
            <dl className="detail-list">
              <div>
                <dt>Duração</dt>
                <dd>{course.duration}</dd>
              </div>
              <div>
                <dt>Público</dt>
                <dd>{course.audience}</dd>
              </div>
              <div>
                <dt>Modalidade</dt>
                <dd>{course.modality}</dd>
              </div>
              <div>
                <dt>Situação</dt>
                <dd>{course.status}</dd>
              </div>
              <div>
                <dt>Certificação</dt>
                <dd>{details.certification}</dd>
              </div>
            </dl>
            <ActionLink
              href="/formularios/inscricao-em-cursos"
              variant={course.status === "Inscrições abertas" ? "dark" : "outline"}
            >
              Inscrever-se
            </ActionLink>
          </aside>
        </div>
      </section>
    </main>
  );
}
