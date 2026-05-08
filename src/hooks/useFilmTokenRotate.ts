import deviceUserAgent from '@/utils/deviceUserAgent';
import { FILM_BASE_URL, FilmDetail_Stream } from '@/utils/scrapers/film';
import { useEffect, useRef } from 'react';

export function useFilmTokenRotate(data: FilmDetail_Stream) {
  const activeTokenRef = useRef<string>('');

  useEffect(() => {
    if (data && data.type === 'stream' && data.streamingLink) {
      try {
        const urlObj = new URL(data.streamingLink);
        const token = urlObj.searchParams.get('t');
        if (token) activeTokenRef.current = token;
      } catch (e) {}
    }
  }, [data]);

  // Rotate token
  useEffect(() => {
    if (!data || data.type !== 'stream' || !data.claim || !data.redeemUrl) return;

    const interval = setInterval(
      async () => {
        try {
          const res = await fetch(data.redeemUrl as string, {
            method: 'POST',
            headers: {
              Referer: FILM_BASE_URL + '/',
              Origin: FILM_BASE_URL,
              'Content-Type': 'application/json',
              'User-Agent': deviceUserAgent,
            },
            body: JSON.stringify({ claim: data.claim }),
          });
          const result = await res.json();

          if (result && result.url) {
            const newToken = new URL(result.url).searchParams.get('t');
            if (newToken) {
              activeTokenRef.current = newToken;
            }
          }
        } catch {}
      },
      40 * 60 * 1000,
    ); // 40 Menit

    return () => clearInterval(interval);
  }, [data]);

  return activeTokenRef;
}
