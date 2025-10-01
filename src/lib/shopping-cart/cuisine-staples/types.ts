export interface CuisineStaple {
  ingredient: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  usage: string;
  culturalContext?: string;
}

export interface CuisineStaplesData {
  cuisine: string;
  staples: CuisineStaple[];
  description: string;
  subStyles?: string[];
}

export interface MissingStaples {
  cuisine: string;
  missing: CuisineStaple[];
  available: CuisineStaple[];
  coverage: number;
}
