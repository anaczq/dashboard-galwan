export const AREAS = {
  prompt: {
    label: "Prompt do Agente",
    description: "Ajustar as instruções e o comportamento do atendente virtual",
    actions: ["view", "create", "edit"] as const,
    routes: ["/prompt"],
  },
  brokers: {
    label: "Corretores",
    description: "Cadastrar, editar e remover corretores e suas agendas",
    actions: ["view", "create", "edit", "delete"] as const,
    routes: ["/corretores"],
  },
  insights: {
    label: "Relatórios",
    description: "Ver métricas e gerar relatórios de desempenho",
    actions: ["view", "create", "edit", "delete"] as const,
    routes: ["/metricas"],
  },
  projects: {
    label: "Projetos",
    description: "Cadastrar, editar e remover os empreendimentos da imobiliária",
    actions: ["view", "create", "edit", "delete"] as const,
    routes: ["/projetos"],
  },
  leads: {
    label: "Leads",
    description: "Acompanhar, atualizar e remover contatos interessados",
    actions: ["view", "edit", "delete"] as const,
    routes: ["/leads"],
  },
  chat: {
    label: "Chat com Assistente",
    description: "Usar o chat do assistente disponível no ícone do canto da tela",
    actions: ["view"] as const,
    routes: [],
  },
} as const

export type AreaSlug = keyof typeof AREAS
export type ActionKey = "view" | "create" | "edit" | "delete"
export type UserRole = "admin" | "colaborador"

export const AREA_SLUGS = Object.keys(AREAS) as AreaSlug[]

export const isAreaSlug = (value: string): value is AreaSlug =>
  Object.prototype.hasOwnProperty.call(AREAS, value)

export const getAreaForRoute = (pathname: string): AreaSlug | null => {
  for (const slug of AREA_SLUGS) {
    if (AREAS[slug].routes.some((route) => pathname.startsWith(route))) {
      return slug
    }
  }
  return null
}

export const ROUTES_OPEN_TO_AUTHENTICATED = [
  "/home",
  "/perfil",
  "/acesso-negado",
] as const
