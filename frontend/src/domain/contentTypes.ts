export type CanalKey =
  | "site"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "kwai"
  | "facebook";

export type TipoKey =
  | "publieditorial"
  | "manchete"
  | "artigo-opiniao"
  | "publicidade-nativa"
  | "talks"
  | "one-talk"      // ✅ NOVO
  | "big-talk"      // ✅ NOVO
  | "little-talk"   // ✅ NOVO
  | "shorts"
  | "feed-reels"
  | "stories"
  | "feed";

export const NAV = {
  todos: { label: "Todos os Conteúdos", path: "/" },

  site: {
    label: "Site/Portal",
    items: [
      { label: "Publieditorial", tipo: "publieditorial" as const },
      { label: "Manchete", tipo: "manchete" as const },
      { label: "Artigo de opinião", tipo: "artigo-opiniao" as const },
      { label: "Publicidade nativa", tipo: "publicidade-nativa" as const },
    ],
  },

  youtube: {
    label: "YouTube",
    items: [
      { label: "TALKS (Geral)", tipo: "talks" as const },

      // ✅ NOVOS tipos específicos
      { label: "ONE TALK", tipo: "one-talk" as const },
      { label: "BIG TALK", tipo: "big-talk" as const },
      { label: "LITTLE TALK", tipo: "little-talk" as const },

      { label: "SHORTS", tipo: "shorts" as const },
    ],
  },

  instagram: {
    label: "Instagram",
    items: [
      { label: "Feed & Reels", tipo: "feed-reels" as const },
      { label: "Stories", tipo: "stories" as const },
    ],
  },

  tiktok: {
    label: "TikTok",
    items: [{ label: "Feed", tipo: "feed" as const }],
  },

  kwai: {
    label: "Kwai",
    items: [{ label: "Feed", tipo: "feed" as const }],
  },

  facebook: {
    label: "Facebook",
    items: [{ label: "Feed", tipo: "feed" as const }],
  },
} as const;

export function buildPath(canal: CanalKey, tipo: TipoKey) {
  return `/${canal}/${tipo}`;
}

export function canalLabel(canal: string) {
  switch (canal) {
    case "site":
      return NAV.site.label;
    case "youtube":
      return NAV.youtube.label;
    case "instagram":
      return NAV.instagram.label;
    case "tiktok":
      return NAV.tiktok.label;
    case "kwai":
      return NAV.kwai.label;
    case "facebook":
      return NAV.facebook.label;
    default:
      return "Canal";
  }
}

export function tipoLabel(canal: string, tipo: string) {
  const group: any = (NAV as any)[canal];
  const found = group?.items?.find((x: any) => x.tipo === tipo);
  return found?.label || "Tipo";
}
