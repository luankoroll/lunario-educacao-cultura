import type { Metadata } from "next";
import {
  FilterableCollection,
  type ExplorerItem,
} from "../components/FilterableCollection";
import { PageIntro } from "../components/InternalPage";
import { editorialItems } from "../lib/content";

const categories = [
  "Crônicas",
  "Ensaios",
  "Educação",
  "Literatura",
  "Cultura",
  "Língua Portuguesa",
];

export const metadata: Metadata = {
  title: "Editorial",
  description:
    "Textos, ensaios, crônicas e reflexões sobre literatura, educação, cultura e linguagem.",
  alternates: { canonical: "/editorial" },
};

const items: ExplorerItem[] = editorialItems.map((item) => ({
  eyebrow: item.category,
  title: item.title,
  description: item.summary,
  meta: [item.date],
  href: `/editorial/${item.slug}`,
  label: "Ler texto",
  attributes: {
    category: item.category,
  },
}));

export default function EditorialPage() {
  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow="Leitura, linguagem e pensamento"
        title="Editorial"
        intro="Textos, ensaios, crônicas, materiais didáticos e reflexões sobre literatura, educação, cultura e linguagem."
      />

      <section className="internal-section" aria-labelledby="editorial-list-title">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Acervo em construção</p>
              <h2 id="editorial-list-title">Textos publicados</h2>
            </div>
            <p>
              Busque por assunto ou escolha uma categoria para percorrer a
              coleção.
            </p>
          </div>

          <FilterableCollection
            items={items}
            filters={[
              {
                key: "category",
                label: "Categoria",
                options: categories,
              },
            ]}
            searchLabel="Buscar no editorial"
            emptyMessage="Nenhum texto corresponde à busca ou à categoria selecionada."
            pageSize={4}
          />
        </div>
      </section>
    </main>
  );
}
