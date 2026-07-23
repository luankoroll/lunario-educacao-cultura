import {
  FilterableCollection,
  type ExplorerItem,
} from "../components/FilterableCollection";
import { PageIntro } from "../components/InternalPage";
import { courseItems } from "../lib/content";

const items: ExplorerItem[] = courseItems.map((course) => ({
  eyebrow: course.status,
  title: course.title,
  description: course.description,
  meta: [course.modality, course.duration, course.audience],
  href: `/cursos/${course.slug}`,
  label: "Saiba mais",
  attributes: {
    modality: course.modality,
    status: course.status,
  },
}));

export default function CoursesPage() {
  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow="Formação e aprendizado"
        title="Cursos"
        intro="Cursos, oficinas e percursos formativos voltados à leitura, à escrita, à literatura, ao ensino e à produção cultural."
      />

      <section className="internal-section" aria-labelledby="courses-list-title">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Percursos formativos</p>
              <h2 id="courses-list-title">Encontre seu próximo curso</h2>
            </div>
            <p>
              Combine modalidade e situação para encontrar a formação mais
              adequada ao seu momento.
            </p>
          </div>

          <FilterableCollection
            items={items}
            filters={[
              {
                key: "modality",
                label: "Modalidade",
                options: ["Presencial", "Híbrido", "Online"],
              },
              {
                key: "status",
                label: "Situação",
                options: ["Inscrições abertas", "Em breve", "Encerradas"],
              },
            ]}
            searchLabel="Buscar cursos"
            emptyMessage="Nenhum curso corresponde à busca e aos filtros selecionados."
            pageSize={6}
          />
        </div>
      </section>
    </main>
  );
}
