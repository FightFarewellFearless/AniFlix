export interface LatestMoviesResponse {
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
  releaseDate: string;
  voteAverage: string;
  viewCount: number;
  quality: null | string;
  country: string;
  runtime: null | number;
  originalLanguage: string;
  popularity: string;
  importedBy: null | string;
  isPublished: boolean;
  createdAt: string;
  contentType: string;
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
