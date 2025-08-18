import defaultDatabase from '../misc/defaultDatabaseValue.json';

// historyItem:title:isComics:isMovie
export type HistoryItemKey = `historyItem:${string}:${'true' | 'false'}:${'true' | 'false'}`;

export type SetDatabaseTarget = keyof typeof defaultDatabase;
