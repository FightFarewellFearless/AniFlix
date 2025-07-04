type watchLaterJSONKeyString = 'link' | 'title' | 'rating' | 'releaseYear' | 'thumbnailUrl';

type watchLaterJSON = Required<
  Record<watchLaterJSONKeyString, string> & {
    date: number;
    genre: string[];
  }
> & {
  isMovie?: boolean;
  isComics?: boolean;
};

export default watchLaterJSON;
