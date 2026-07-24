export type EditorialItem = {
  category: string;
  title: string;
  summary: string;
  date: string;
  slug: string;
};

export type CourseItem = {
  title: string;
  modality: string;
  duration: string;
  audience: string;
  description: string;
  status: "Inscrições abertas" | "Em breve" | "Encerradas";
  slug: string;
};

export type PublicationItem = {
  title: string;
  type: string;
  year: string;
  source: string;
  description: string;
  slug: string;
};

export type EventItem = {
  title: string;
  type: string;
  period: string;
  location: string;
  description: string;
  href: string;
  featured?: boolean;
};

export const editorialItems: EditorialItem[] = [
  {
    category: "Ensaios",
    title: "A leitura como forma de presença",
    summary:
      "Uma reflexão sobre o tempo da leitura, a escuta e os encontros que um texto pode inaugurar.",
    date: "18 de julho de 2026",
    slug: "a-leitura-como-forma-de-presenca",
  },
  {
    category: "Educação",
    title: "Entre a sala de aula e o mundo",
    summary:
      "Notas sobre práticas de linguagem que aproximam experiência, repertório e participação.",
    date: "10 de julho de 2026",
    slug: "entre-a-sala-de-aula-e-o-mundo",
  },
  {
    category: "Crônicas",
    title: "Crônica de uma cidade que lê",
    summary:
      "Livros, ruas e pequenas cenas de leitura no cotidiano de uma cidade em movimento.",
    date: "28 de junho de 2026",
    slug: "cronica-de-uma-cidade-que-le",
  },
  {
    category: "Literatura",
    title: "O intervalo entre duas páginas",
    summary:
      "Breve ensaio sobre silêncio, imaginação e os espaços que o leitor completa.",
    date: "15 de junho de 2026",
    slug: "o-intervalo-entre-duas-paginas",
  },
  {
    category: "Cultura",
    title: "Cultura também se faz por aproximação",
    summary:
      "Como encontros locais e redes de colaboração sustentam experiências culturais duradouras.",
    date: "3 de junho de 2026",
    slug: "cultura-tambem-se-faz-por-aproximacao",
  },
  {
    category: "Língua Portuguesa",
    title: "Palavras em uso, sentidos em trânsito",
    summary:
      "Um percurso acessível pelas mudanças de sentido que acontecem na língua cotidiana.",
    date: "22 de maio de 2026",
    slug: "palavras-em-uso-sentidos-em-transito",
  },
];

export const courseItems: CourseItem[] = [
  {
    title: "Oficina de escrita literária",
    modality: "Presencial",
    duration: "12 horas",
    audience: "Jovens e adultos",
    description:
      "Práticas de observação, criação de repertório e elaboração de textos breves.",
    status: "Inscrições abertas",
    slug: "oficina-de-escrita-literaria",
  },
  {
    title: "Leitura e mediação cultural",
    modality: "Híbrido",
    duration: "20 horas",
    audience: "Educadores e mediadores",
    description:
      "Estratégias para criar conversas, percursos e comunidades em torno dos livros.",
    status: "Em breve",
    slug: "leitura-e-mediacao-cultural",
  },
  {
    title: "Literatura na escola",
    modality: "Online",
    duration: "16 horas",
    audience: "Professoras e professores",
    description:
      "Planejamento de experiências literárias que valorizam leitura, autoria e escuta.",
    status: "Encerradas",
    slug: "literatura-na-escola",
  },
  {
    title: "Crônica: olhar, memória e cidade",
    modality: "Online",
    duration: "8 horas",
    audience: "Público geral",
    description:
      "Um percurso breve para transformar cenas cotidianas em matéria de escrita.",
    status: "Em breve",
    slug: "cronica-olhar-memoria-e-cidade",
  },
  {
    title: "Produção cultural em pequena escala",
    modality: "Híbrido",
    duration: "18 horas",
    audience: "Agentes e produtores culturais",
    description:
      "Ferramentas essenciais para desenhar, organizar e comunicar iniciativas culturais.",
    status: "Inscrições abertas",
    slug: "producao-cultural-em-pequena-escala",
  },
  {
    title: "Laboratório de leitura crítica",
    modality: "Presencial",
    duration: "10 horas",
    audience: "Estudantes e leitores",
    description:
      "Encontros dedicados à argumentação, à interpretação e ao diálogo entre textos.",
    status: "Encerradas",
    slug: "laboratorio-de-leitura-critica",
  },
];

export const publicationItems: PublicationItem[] = [
  {
    title: "Cadernos de leitura e cultura",
    type: "Livros",
    year: "2026",
    source: "Editora a definir",
    description:
      "Ensaios sobre leitura, circulação cultural e formação de comunidades leitoras.",
    slug: "cadernos-de-leitura-e-cultura",
  },
  {
    title: "Educação, linguagem e presença",
    type: "Artigos",
    year: "2025",
    source: "Periódico a definir",
    description:
      "Reflexões sobre linguagem, experiência e participação em contextos educativos.",
    slug: "educacao-linguagem-e-presenca",
  },
  {
    title: "Percursos de escrita",
    type: "Materiais didáticos",
    year: "2025",
    source: "Edição independente",
    description:
      "Propostas de leitura e escrita para oficinas, salas de aula e grupos culturais.",
    slug: "percursos-de-escrita",
  },
  {
    title: "Notas sobre a cidade leitora",
    type: "Ensaios",
    year: "2024",
    source: "Caderno cultural",
    description:
      "Textos breves sobre bibliotecas, ruas, memória e práticas culturais urbanas.",
    slug: "notas-sobre-a-cidade-leitora",
  },
  {
    title: "Mediação e repertório",
    type: "Capítulos de livros",
    year: "2024",
    source: "Coletânea acadêmica",
    description:
      "Capítulo dedicado à mediação de leitura como prática de escuta e curadoria.",
    slug: "mediacao-e-repertorio",
  },
  {
    title: "Cartografias da palavra",
    type: "Produções artísticas",
    year: "2023",
    source: "Projeto autoral",
    description:
      "Série de experimentações gráficas e textuais sobre território e linguagem.",
    slug: "cartografias-da-palavra",
  },
];

export const eventItems: EventItem[] = [
  {
    title: "2ª Bienal Internacional do Livro de Jaraguá do Sul",
    type: "Evento literário",
    period: "08 de agosto de 2026",
    location: "Jaraguá do Sul — local a confirmar",
    description:
      "Um encontro dedicado aos livros, aos leitores e às redes que fortalecem a cultura literária.",
    href: "/eventos/bienal-internacional-do-livro-2026",
    featured: true,
  },
  {
    title: "Sarau Lunário",
    type: "Projeto cultural",
    period: "Em planejamento",
    location: "Local a definir",
    description:
      "Encontro aberto para leitura, música, conversa e circulação de produções autorais.",
    href: "/projetos/sarau-lunario",
  },
  {
    title: "Círculo de leitura",
    type: "Projeto continuado",
    period: "2026",
    location: "Jaraguá do Sul",
    description:
      "Reuniões periódicas para compartilhar leituras e ampliar repertórios em comunidade.",
    href: "/projetos/circulo-de-leitura",
  },
];

export const formCards = [
  {
    title: "Avaliação do caderno de Língua Portuguesa",
    description:
      "Autoavaliação do 6º ano 01 referente ao 2º trimestre de 2025.",
    label: "Responder autoavaliação",
    href: "/formularios/avaliacao-caderno-6-01",
  },
  {
    title: "Inscrição em cursos",
    description:
      "Formulário para inscrição nos cursos e oficinas disponíveis.",
    label: "Acessar formulário",
    href: "/formularios/inscricao-em-cursos",
  },
  {
    title: "Participação em eventos",
    description:
      "Formulário para inscrição ou manifestação de interesse em eventos e projetos.",
    label: "Acessar formulário",
    href: "/formularios/participacao-em-eventos",
  },
  {
    title: "Contato e propostas",
    description:
      "Espaço para mensagens, convites, propostas de parceria e solicitações profissionais.",
    label: "Entrar em contato",
    href: "/formularios/contato",
  },
];

export const navItems = [
  { label: "Editorial", href: "/#editorial" },
  { label: "Cursos", href: "/#cursos" },
  {
    label: "Produção bibliográfica",
    href: "/#producao-bibliografica",
  },
  { label: "Eventos e projetos", href: "/#eventos-projetos" },
  { label: "Formulários", href: "/#formularios" },
];
