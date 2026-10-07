/** Product identity. The name is provisional: change it here. */
export const siteConfig = {
  name: "Garimpo",
  tagline: "Lojas sem site ou com site quebrado",
  description:
    "Encontre lojas por estado e cidade e veja quais não têm site, só têm rede social ou têm o site fora do ar.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
