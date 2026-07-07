import defaultDatabase from '@misc/defaultDatabaseValue.json';

// historyItem:title:isComics:isMovie
// historyItem:title:isComics:isMovie:isNovel
export type HistoryItemKey =
  | `historyItem:${string}:${'true' | 'false'}:${'true' | 'false'}`
  | `historyItem:${string}:${'true' | 'false'}:${'true' | 'false'}:${'true' | 'false'}`;

export type SetDatabaseTarget = keyof typeof defaultDatabase;
