export interface SeriesSeasonResponse {
  series: Series;
  season: Season;
}

interface Season {
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

interface CreatedAt {}

interface Series {
  id: string;
  title: string;
  slug: string;
}
