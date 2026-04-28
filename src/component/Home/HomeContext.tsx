import { EpisodeBaruHome } from '@/types/anime';
import {
  ComicsListContext,
  EpisodeBaruHomeContext,
  FilmListHomeContext,
  MovieListHomeContext,
  SeriesListHomeContext,
} from '@misc/context';
import { Movies } from '@utils/scrapers/animeMovie';
import { LatestComicsRelease } from '@utils/scrapers/comicsv2';
import { FilmHomePage } from '@utils/scrapers/film';
import React, { useMemo, useState } from 'react';

export default function HomeContext({ children }: { children: React.ReactNode }) {
  const [paramsState, setParamsState] = useState<EpisodeBaruHome>({
    jadwalAnime: {},
    newAnime: [],
  });
  const [movieParamsState, setMovieParamsState] = useState<Movies[]>([]);
  const [filmParamsState, setFilmParamsState] = useState<FilmHomePage>([]);
  const [seriesParamsState, setSeriesParamsState] = useState<FilmHomePage>([]);
  const [comicsData, setComicsData] = useState<LatestComicsRelease[]>([]);

  return (
    <EpisodeBaruHomeContext value={useMemo(() => ({ paramsState, setParamsState }), [paramsState])}>
      <FilmListHomeContext
        value={useMemo(
          () => ({
            paramsState: filmParamsState,
            setParamsState: setFilmParamsState,
          }),
          [filmParamsState],
        )}>
        <SeriesListHomeContext
          value={useMemo(
            () => ({
              paramsState: seriesParamsState,
              setParamsState: setSeriesParamsState,
            }),
            [seriesParamsState],
          )}>
          <MovieListHomeContext
            value={useMemo(
              () => ({
                paramsState: movieParamsState,
                setParamsState: setMovieParamsState,
              }),
              [movieParamsState],
            )}>
            <ComicsListContext
              value={useMemo(
                () => ({
                  paramsState: comicsData,
                  setParamsState: setComicsData,
                }),
                [comicsData],
              )}>
              {children}
            </ComicsListContext>
          </MovieListHomeContext>
        </SeriesListHomeContext>
      </FilmListHomeContext>
    </EpisodeBaruHomeContext>
  );
}
