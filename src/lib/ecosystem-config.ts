export type EcosystemLinks = {
  ai: string;
  api: string;
  lab: string;
};

const development = process.env.NODE_ENV === "development";

export const ECOSYSTEM_PUBLIC_LINKS: EcosystemLinks = {
  ai:
    process.env.NEXT_PUBLIC_AI_WORKSPACE_URL?.trim() ||
    (development ? "http://localhost:3001" : "https://ai.yanchuaner.cn"),
  api:
    process.env.NEXT_PUBLIC_API_PLATFORM_URL?.trim() ||
    (development ? "http://localhost:3101" : "https://api.yanchuaner.cn"),
  lab:
    process.env.NEXT_PUBLIC_LAB_URL?.trim() ||
    (development ? "http://localhost:3100" : "https://lab.yanchuaner.cn"),
};

export function getServerEcosystemLinks(): EcosystemLinks {
  return {
    ...ECOSYSTEM_PUBLIC_LINKS,
    ai: process.env.AI_WORKSPACE_URL?.trim() || ECOSYSTEM_PUBLIC_LINKS.ai,
    api: process.env.API_PLATFORM_URL?.trim() || ECOSYSTEM_PUBLIC_LINKS.api,
  };
}
