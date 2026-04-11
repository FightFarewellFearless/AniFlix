export interface SeriesDetailsResponse {
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
  firstAirDate: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  voteAverage: string;
  popularity: string;
  originalLanguage: string;
  country: string;
  trailerUrl: string;
  status: string;
  networks: Network[];
  productionCompanies: ProductionCompany[];
  keywords: Keyword[];
  createdBy: any[];
  importedBy: string;
  viewCount: number;
  watchlistCount: number;
  favouriteCount: number;
  isPublished: boolean;
  createdAt: CreatedAt;
  updatedAt: CreatedAt;
  genres: Genre[];
  cast: Cast[];
  seasons: Season[];
  firstSeason: FirstSeason;
}

interface FirstSeason {
  id: string;
  tvSeriesId: string;
  tmdbId: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string;
  airDate: string;
  episodeCount: number;
  isPublished: boolean;
  createdAt: CreatedAt;
  updatedAt: CreatedAt;
  episodes: Episode[];
}

interface Episode {
  id: string;
  seasonId: string;
  tvSeriesId: string;
  tmdbId: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string;
  airDate: string;
  runtime: number;
  voteAverage: string;
  quality: null;
  viewCount: number;
  isPublished: boolean;
  createdAt: CreatedAt;
  updatedAt: CreatedAt;
  hasVideo: boolean;
}

interface Season {
  id: string;
  tvSeriesId: string;
  tmdbId: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string;
  airDate: null | string;
  episodeCount: number;
  isPublished: boolean;
  createdAt: CreatedAt;
  updatedAt: CreatedAt;
}

interface Cast {
  id: string;
  tvSeriesId: string;
  tmdbPersonId: number;
  name: string;
  character: string;
  profilePath: string;
  order: number;
}

interface Genre {
  id: string;
  tmdbId: number;
  name: string;
  slug: string;
  createdAt: CreatedAt;
}

interface CreatedAt {}

interface Keyword {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string;
}

interface Network {
  id: number;
  name: string;
  logo_path: string;
  origin_country: string;
}
