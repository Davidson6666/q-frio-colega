import { normalizeText } from "@/lib/geo/states";

/**
 * Store types the user can pick. Each one maps to Overture Maps categories.
 * A category id matches a place when it appears anywhere in the place's category
 * hierarchy, so "restaurant" also covers pizza, burger, Brazilian restaurants, etc.
 *
 * Only ids seen in real Brazilian data are listed here. Unknown ids would just
 * match nothing, so a wrong one fails silently: keep new entries verified.
 */
export interface Niche {
  label: string;
  /** Other words people type for the same thing. */
  aliases: string[];
  categories: string[];
}

export const NICHES: Niche[] = [
  { label: "Barbearia", aliases: ["barbeiro", "barber"], categories: ["barber"] },
  {
    label: "Salão de beleza",
    aliases: ["cabeleireiro", "cabeleireira", "salao", "manicure", "estetica"],
    categories: ["beauty_salon", "hair_salon"],
  },
  { label: "Spa e massagem", aliases: ["spa", "massagem"], categories: ["spa"] },
  { label: "Restaurante", aliases: ["restaurantes"], categories: ["restaurant"] },
  { label: "Pizzaria", aliases: ["pizza"], categories: ["pizza_restaurant"] },
  { label: "Hamburgueria", aliases: ["lanchonete", "hamburguer", "lanches"], categories: ["burger_restaurant"] },
  { label: "Padaria", aliases: ["confeitaria"], categories: ["bakery"] },
  { label: "Sorveteria", aliases: ["acaiteria"], categories: ["ice_cream_shop"] },
  { label: "Bar", aliases: ["boteco", "pub"], categories: ["bar"] },
  { label: "Mercado", aliases: ["supermercado", "mercearia"], categories: ["grocery_store", "convenience_store"] },
  { label: "Loja de roupas", aliases: ["roupas", "moda", "boutique"], categories: ["clothing_store"] },
  { label: "Loja de calçados", aliases: ["calcados", "sapataria"], categories: ["shoe_store"] },
  { label: "Ótica", aliases: ["otica", "oculos"], categories: ["eyewear_store"] },
  { label: "Loja de móveis", aliases: ["moveis", "marcenaria"], categories: ["furniture_store"] },
  { label: "Loja de eletrônicos", aliases: ["eletronicos", "celulares", "informatica"], categories: ["electronics_store"] },
  { label: "Material de construção", aliases: ["construcao", "ferragens"], categories: ["building_supply_store", "hardware_store"] },
  { label: "Pet shop", aliases: ["petshop", "pet", "veterinaria", "animais"], categories: ["pet_store"] },
  { label: "Farmácia", aliases: ["drogaria"], categories: ["pharmacy"] },
  { label: "Oficina mecânica", aliases: ["oficina", "mecanica", "mecanico", "auto eletrica"], categories: ["automotive_repair"] },
  { label: "Autopeças", aliases: ["auto pecas", "pecas"], categories: ["auto_parts_store"] },
  { label: "Revenda de veículos", aliases: ["concessionaria", "carros", "veiculos", "seminovos"], categories: ["auto_dealer"] },
  { label: "Borracharia e pneus", aliases: ["borracharia", "pneus"], categories: ["tire_dealer_and_repair"] },
  { label: "Posto de combustível", aliases: ["posto", "combustivel", "gasolina"], categories: ["gas_station"] },
  { label: "Clínica odontológica", aliases: ["dentista", "odontologia", "clinica odontologica"], categories: ["dental_clinic"] },
  { label: "Consultório médico", aliases: ["medico", "clinica medica", "consultorio"], categories: ["doctors_office"] },
  { label: "Psicologia", aliases: ["psicologo", "psicologa", "terapia"], categories: ["psychology"] },
  { label: "Fisioterapia", aliases: ["fisioterapeuta"], categories: ["physical_therapy"] },
  { label: "Academia", aliases: ["musculacao", "crossfit", "fitness"], categories: ["gym"] },
  { label: "Escola", aliases: ["colegio", "creche", "escola infantil"], categories: ["school"] },
  { label: "Advogado", aliases: ["advocacia", "escritorio de advocacia"], categories: ["attorney_or_law_firm"] },
  { label: "Contabilidade", aliases: ["contador", "escritorio de contabilidade"], categories: ["accountant"] },
  { label: "Imobiliária", aliases: ["imoveis", "corretor de imoveis"], categories: ["real_estate_service"] },
  { label: "Eventos e festas", aliases: ["eventos", "festas", "buffet", "salao de festas"], categories: ["party_and_event_planning"] },
  { label: "Hotel e pousada", aliases: ["hotel", "pousada", "hospedagem"], categories: ["hotel"] },
];

export type NicheQuery =
  | { kind: "category"; niche: Niche }
  /** Not a known type: look the text up inside store names instead. */
  | { kind: "name"; text: string };

/** "Barbearias " and "barbearia" compare equal; accents and case are ignored. */
function canonical(value: string): string {
  const text = normalizeText(value);
  return text.length > 3 ? text.replace(/s$/, "") : text;
}

export function resolveNiche(input: string): NicheQuery {
  const wanted = canonical(input);

  for (const niche of NICHES) {
    if (canonical(niche.label) === wanted) return { kind: "category", niche };
    if (niche.aliases.some((alias) => canonical(alias) === wanted)) return { kind: "category", niche };
  }
  return { kind: "name", text: normalizeText(input) };
}

/** Whether a place with these categories belongs to the niche query. */
export function matchesNiche(query: NicheQuery, place: { name: string; hierarchy: string[] }): boolean {
  if (query.kind === "category") {
    return place.hierarchy.some((category) => query.niche.categories.includes(category));
  }
  return normalizeText(place.name).includes(query.text);
}
