export interface HomepageApiResponse {
  above: Above[];
  below: Below[];
  ads: Ad[];
}

interface Ad {
  id: string;
  name: string;
  placement: string;
  format: string;
  imageUrl: string;
  targetUrl: string;
  htmlContent: null;
  config: Config;
  surfaces: string[];
  isActive: boolean;
  startDate: null;
  endDate: null;
  sortOrder: number;
  createdAt: CreatedAt;
  updatedAt: CreatedAt;
}

interface Config {
  duration?: number;
}

interface Below {
  id: string;
  type: string;
  title: string;
  slug: string;
  description: null | string;
  sortOrder: number;
  showAds: boolean;
  adIds: any[];
  data: Datum2[];
}

export interface Datum2 {
  id: string;
  title?: string;
  slug?: string;
  posterPath?: string;
  backdropPath?: string;
  firstAirDate?: string;
  numberOfSeasons?: number;
  voteAverage: string;
  viewCount: number;
  networks?: Network[];
  contentType: string;
  commentCount: number;
  releaseDate?: string;
  quality?: null | string;
  country?: string;
  runtime?: number;
  logoPath?: string;
  overview?: string;
  trailerUrl?: null | string;
  genres?: Genre2[];
  productionCompanies?: ProductionCompany2[];
  name?: string;
  episodeNumber?: number;
  stillPath?: string;
  season?: Season;
  series?: Series;
}

interface Series {
  title: string;
  slug: string;
  posterPath: string;
  firstAirDate: string;
}

interface Season {
  seasonNumber: number;
}

interface ProductionCompany2 {
  id: number;
  name: string;
  logo_path: string;
}

interface Above {
  id: string;
  type: string;
  title: string;
  slug: string;
  description: null;
  sortOrder: number;
  showAds: boolean;
  adIds: string[];
  data: Datum[];
  trendingCountry?: string;
  trendingCountryName?: string;
}

export interface Datum {
  id: string;
  contentType: string;
  content?: Content;
  title: null | string;
  description?: null;
  backdropOverride?: null;
  slug?: string;
  posterPath?: string;
  backdropPath?: string;
  logoPath?: null | string;
  overview?: string;
  firstAirDate?: string;
  voteAverage?: string;
  viewCount?: number;
  country?: string;
  numberOfSeasons?: number;
  trailerUrl?: null | string;
  networks?: Network[];
  genres?: Genre2[];
  commentCount?: number;
  releaseDate?: string;
  quality?: string;
  runtime?: number;
  productionCompanies?: ProductionCompany[];
}

interface Genre2 {
  id: string;
  name: string;
}

interface Content {
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
  firstAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  voteAverage: string;
  popularity: string;
  originalLanguage: string;
  country: string;
  trailerUrl: null | string;
  status: string;
  networks?: Network[];
  productionCompanies: ProductionCompany[];
  keywords: Keyword[];
  createdBy?: (CreatedBy | CreatedBy2)[];
  importedBy: string;
  viewCount: number;
  watchlistCount: number;
  favouriteCount: number;
  isPublished: boolean;
  createdAt: CreatedAt;
  updatedAt: CreatedAt;
  genres: Genre[];
  releaseDate?: string;
  runtime?: number;
  quality?: string;
  director?: string;
  hasVideo?: boolean;
}

interface Genre {
  id: string;
  tmdbId: number;
  name: string;
  slug: string;
  createdAt: CreatedAt;
}

interface CreatedAt {}

interface CreatedBy2 {
  id: number;
  name: string;
  gender: number;
  credit_id: string;
  profile_path: string;
  original_name: string;
}

interface CreatedBy {
  id: number;
  name: string;
  gender: number;
  credit_id: string;
  profile_path: null;
  original_name: string;
}

interface Keyword {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: null | string | string;
}

interface Network {
  id: number;
  name: string;
  logo_path: string;
  origin_country: string;
}
