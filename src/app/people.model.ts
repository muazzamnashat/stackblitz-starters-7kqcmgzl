export interface Person {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
  films: string[];
  species: string[];
  vehicles: string[];
  starships: string[];
  created: string;
  edited: string;
  url: string;
}

export interface PeoplePage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Person[];
}

export interface RelatedResource {
  name?: string;
  title?: string;
  episode_id?: number;
  release_date?: string;
  model?: string;
  climate?: string;
  classification?: string;
  url?: string;
}

export interface RelatedItem {
  label: string;
  detail?: string;
  url: string;
}

export function personId(person: Person): string {
  return person.url.match(/\/people\/(\d+)\/?$/)?.[1] ?? '';
}

export function displayValue(value: string | null | undefined): string {
  if (!value || value.toLowerCase() === 'unknown') return 'Unknown';
  if (value.toLowerCase() === 'n/a') return 'Not applicable';
  return value;
}
