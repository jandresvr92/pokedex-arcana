// ─── Raw PokeAPI types ─────────────────────────────────────────────────────

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface PokemonAbility {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    dream_world: {
      front_default: string | null;
    };
    home: {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  sprites: PokemonSprites;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  species: NamedAPIResource;
  location_area_encounters: string;
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: NamedAPIResource;
  pokedex_numbers: Array<{ entry_number: number; pokedex: NamedAPIResource }>;
  egg_groups: NamedAPIResource[];
  color: NamedAPIResource;
  shape: NamedAPIResource;
  evolves_from_species: NamedAPIResource | null;
  flavor_text_entries: FlavorTextEntry[];
  genera: Array<{ genus: string; language: NamedAPIResource }>;
  generation: NamedAPIResource;
  evolution_chain: { url: string };
}

export interface TypeDamageRelations {
  double_damage_to: NamedAPIResource[];
  double_damage_from: NamedAPIResource[];
  half_damage_to: NamedAPIResource[];
  half_damage_from: NamedAPIResource[];
  no_damage_to: NamedAPIResource[];
  no_damage_from: NamedAPIResource[];
}

export interface TypePokemonEntry {
  pokemon: NamedAPIResource;
  slot: number;
}

export interface PokemonTypeDetail {
  damage_relations: TypeDamageRelations;
  pokemon: TypePokemonEntry[];
}

export interface PokemonMove {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  type: NamedAPIResource;
  damage_class: NamedAPIResource;
}

export interface LocationAreaEncounter {
  location_area: NamedAPIResource;
}

export interface EvolutionChainLink {
  species: NamedAPIResource;
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionChainLink;
}

// ─── App-level types ────────────────────────────────────────────────────────

export interface PokemonCard {
  id: number;
  name: string;
  types: string[];
  sprite: string | null;
  officialArt: string | null;
}

export interface PokemonDetail extends PokemonCard {
  height: number;
  weight: number;
  baseExperience: number;
  abilities: { name: string; isHidden: boolean }[];
  stats: { name: string; value: number }[];
  strongAgainst: PokemonCard[];
  weakAgainst: PokemonCard[];
  species: {
    description: string;
    category: string;
    generation: string;
    eggGroups: string[];
    captureRate: number;
    isLegendary: boolean;
    isMythical: boolean;
  };
}

export type Locale = 'en' | 'es';
