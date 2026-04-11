export interface LatestSeriesResponse {
  data: Datum[];
  pagination: Pagination;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Datum {
  id: string;
  title: string;
  slug: string;
  posterPath: string;
  backdropPath: string;
  firstAirDate: string;
  voteAverage: string;
  viewCount: number;
  country: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  originalLanguage: string;
  popularity: string;
  importedBy: null | string;
  isPublished: boolean;
  createdAt: string;
  genres: Genre[];
  importerUsername: null | string;
  commentCount: number;
  hasVideo: boolean;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}
