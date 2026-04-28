export interface FilmMovieDetailsResponse {
  id: string;
  tmdbId: number;
  imdbId: string;
  title: string;
  slug: string;
  originalTitle: string;
  overview: string;
  tagline: string;
  posterPath: string;
  backdropPath: string;
  logoPath: string;
  backdrops: string[];
  releaseDate: string;
  runtime: number;
  voteAverage: string;
  popularity: string;
  originalLanguage: string;
  country: string;
  status: string;
  trailerUrl: string;
  quality: string;
  director: string;
  directorTmdbId: null;
  directorProfilePath: null;
  productionCompanies: ProductionCompany[];
  keywords: Keyword[];
  importedBy: string;
  viewCount: number;
  watchlistCount: number;
  favouriteCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  genres: Genre[];
  cast: Cast[];
  hasVideo: boolean;
}

interface Cast {
  id: string;
  movieId: string;
  tmdbPersonId: number;
  name: string;
  character: string;
  profilePath: null | string;
  order: number;
}

interface Genre {
  id: string;
  tmdbId: number;
  name: string;
  slug: string;
  createdAt: string;
}

interface Keyword {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string;
}
