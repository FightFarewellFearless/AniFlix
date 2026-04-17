import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Comics1ChapterSessionFetcherContext,
  comics1FetchChapterSession,
} from './comics1chaptersessionfetchercontext.ts';
import Comics1ChapterSessionWebView from './comics1chaptersessionfetcherwebview.tsx';
import {
  comics1FetchSession,
  Comics1SessionFetcherContext,
  PromiseResRej,
} from './comics1sessionfetchercontext.ts';
import Comics1SessionWebView from './comics1sessionfetcherwebview.tsx';

export default function SetupComics1() {
  const [isComics1FetchSessionOpen, setIsComics1FetchSessionOpen] = useState(false);
  const [isComics1FetchChapterSessionOpen, setIsComics1FetchChapterSessionOpen] = useState(false);
  const comics1SessionPromisesCollector = useRef<PromiseResRej[]>([]);
  const comics1ChapterSessionPromisesCollector = useRef<PromiseResRej[]>([]);
  const comics1ChapterSessionUrl = useRef('');

  useEffect(() => {
    comics1FetchSession.getSessionPath = (
      res: PromiseResRej['resolve'],
      rej: PromiseResRej['reject'],
    ) => {
      comics1SessionPromisesCollector.current.push({ resolve: res, reject: rej });
      setIsComics1FetchSessionOpen(true);
    };
    comics1FetchSession.abortCleanup = () => {
      setIsComics1FetchSessionOpen(false);
      while (comics1SessionPromisesCollector.current.length > 0) {
        const val = comics1SessionPromisesCollector.current.shift();
        val?.reject();
      }
    };

    comics1FetchChapterSession.getChapterSessionPath = (
      chapterUrl: string,
      res: PromiseResRej['resolve'],
      rej: PromiseResRej['reject'],
    ) => {
      comics1ChapterSessionUrl.current = chapterUrl;
      comics1ChapterSessionPromisesCollector.current.push({ resolve: res, reject: rej });
      setIsComics1FetchChapterSessionOpen(true);
    };
    comics1FetchChapterSession.abortCleanup = () => {
      setIsComics1FetchChapterSessionOpen(false);
      while (comics1ChapterSessionPromisesCollector.current.length > 0) {
        const val = comics1ChapterSessionPromisesCollector.current.shift();
        val?.reject();
      }
    };
  }, []);

  return (
    <Fragment>
      <Comics1SessionFetcherContext
        value={useMemo(
          () => ({
            isOpen: isComics1FetchSessionOpen,
            setIsOpen: setIsComics1FetchSessionOpen,
            promisesCollector: comics1SessionPromisesCollector,
          }),
          [isComics1FetchSessionOpen],
        )}>
        {isComics1FetchSessionOpen && <Comics1SessionWebView />}
      </Comics1SessionFetcherContext>
      <Comics1ChapterSessionFetcherContext
        value={useMemo(
          () => ({
            isOpen: isComics1FetchChapterSessionOpen,
            chapterUrl: comics1ChapterSessionUrl,
            setIsOpen: setIsComics1FetchChapterSessionOpen,
            promisesCollector: comics1ChapterSessionPromisesCollector,
          }),
          [isComics1FetchChapterSessionOpen],
        )}>
        {isComics1FetchChapterSessionOpen && <Comics1ChapterSessionWebView />}
      </Comics1ChapterSessionFetcherContext>
    </Fragment>
  );
}
