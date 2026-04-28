export interface SearchFilmResponse {
  results: Result[];
  total: number;
}

interface Result {
  id: string;
  contentType: string;
  title: string;
  originalTitle: string;
  overview: string;
  genres: string[];
  originalLanguage: string;
  voteAverage: number;
  viewCount: number;
  popularity: number;
  posterPath: string;
  backdropPath: string;
  slug: string;
  firstAirDate?: string;
  numberOfSeasons?: number;
  releaseDate?: string;
  quality?: string;
}
