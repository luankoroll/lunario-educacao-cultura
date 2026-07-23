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

const items: ExplorerItem[] = editorialItems.map((item) => ({
  eyebrow: item.category,
  title: item.title,
  description: item.summary,
  meta: [item.date],
  href: `/editorial?texto=${item.slug}#texto`,
  label: "Ler texto",
  attributes: {
    category: item.category,
  },
}));

type EditorialPageProps = {
  searchParams: Promise<{ texto?: string | string[] }>;
};

export default async function EditorialPage({
  searchParams,
}: EditorialPageProps) {
  const { texto } = await searchParams;
  const selectedSlug = Array.isArray(texto) ? texto[0] : texto;
  const selectedItem = editorialItems.find(
    (item) => item.slug === selectedSlug,
  );

  return (
    <main id="conteudo" className="internal-page">
      <PageIntro
        eyebrow="Leitura, linguagem e pensamento"
        title="Editorial"
        intro="Textos, ensaios, crônicas, materiais didáticos e reflexões sobre literatura, educação, cultura e linguagem."
      />

      {selectedItem ? (
        <section
          className="internal-section internal-section--soft"
          id="texto"
          aria-labelledby="selected-editorial-title"
        >
          <div className="page-shell">
            <article className="detail-panel detail-panel--wide prose">
              <p className="eyebrow">
                {selectedItem.category} · {selectedItem.date}
              </p>
              <h2 id="selected-editorial-title">{selectedItem.title}</h2>
              <p className="lead">{selectedItem.summary}</p>
              <p>
                Este espaço está preparado para receber a íntegra do texto,
                referências, imagens e informações de autoria. O conteúdo
                editorial poderá ser atualizado sem alterar a estrutura da
                página.
              </p>
              <p>
                Nesta versão inicial, a apresentação funciona como uma leitura
                demonstrativa e sinaliza com clareza onde o texto completo será
                publicado.
              </p>
            </article>
          </div>
        </section>
      ) : null}

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
