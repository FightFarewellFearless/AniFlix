import React from 'react';
import { View } from 'react-native';

/**
 * Electron implementation of `expo-video`.
 *
 * `expo-video` is a native module, so the original shim was a no-op: every
 * video element rendered nothing and every player method did nothing. This
 * shim implements the small subset of the expo-video API that the shared
 * application uses on top of a real HTML5 `<video>` element.
 *
 * The full featured video player used by the Watch screen lives in
 * `src/component/VideoPlayer/index.windows.tsx`; this module is what powers
 * the remaining (`useVideoPlayer` + `VideoView`) call sites such as the
 * anime-by-image preview modal.
 */

type PlayerStatus = 'idle' | 'loading' | 'readyToPlay' | 'error';

type Listener = (payload: any) => void;

type PlayerSource =
  | string
  | {
      uri?: string;
      headers?: Record<string, string>;
      contentType?: 'auto' | 'hls' | 'progressive';
      metadata?: Record<string, unknown>;
    }
  | null
  | undefined;

type VideoViewProps = {
  player?: VideoPlayer;
  style?: any;
  nativeControls?: boolean;
  contentFit?: string;
  allowsPictureInPicture?: boolean;
  onPictureInPictureStop?: () => void;
  [key: string]: any;
};

const normalizeUri = (source: PlayerSource): string => {
  if (!source) return '';
  if (typeof source === 'string') return source;
  return source.uri ?? '';
};

const normalizeHeaders = (source: PlayerSource): Record<string, string> => {
  if (!source || typeof source === 'string') return {};
  return source.headers ?? {};
};

let mediaHeaderApiWarned = false;

function applyRequestHeaders(source: PlayerSource) {
  if (typeof window === 'undefined') return;
  const api = (window as any).electronAPI?.media;
  const uri = normalizeUri(source);
  if (!uri) return;
  try {
    if (api?.setHeaders) {
      void api.setHeaders({ url: uri, headers: normalizeHeaders(source) });
    } else if (!mediaHeaderApiWarned && normalizeHeaders(source)['Referer']) {
      mediaHeaderApiWarned = true;
      console.warn('[expo-video shim] media header bridge is not available');
    }
  } catch (error) {
    console.warn('[expo-video shim] unable to register media headers', error);
  }
}

class WebVideoPlayer {
  readonly element: HTMLVideoElement;

  private listeners = new Map<string, Set<Listener>>();
  private status: PlayerStatus = 'idle';
  private source: PlayerSource = null;
  private playbackIntent = false;
  private interval = 1;
  private readonly cleanups: Array<() => void> = [];

  constructor() {
    this.element = document.createElement('video');
    this.element.preload = 'metadata';
    this.element.playsInline = true;
    this.element.crossOrigin = null;
    this.element.style.width = '100%';
    this.element.style.height = '100%';
    this.element.style.display = 'block';
    this.element.style.backgroundColor = '#000';

    this.bind();
  }

  private bind() {
    const el = this.element;

    const on = <K extends keyof HTMLMediaElementEventMap>(
      event: K,
      handler: (event: HTMLMediaElementEventMap[K]) => void,
    ) => {
      el.addEventListener(event, handler as EventListener);
      this.cleanups.push(() => el.removeEventListener(event, handler as EventListener));
    };

    on('loadedmetadata', () => {
      this.setStatus('readyToPlay');
      this.emit('statusChange', { status: 'readyToPlay', oldStatus: 'loading', error: null });
      this.emit('sourceLoad', {
        duration: this.duration,
        availableVideoTracks: [],
        availableAudioTracks: [],
        availableSubtitleTracks: [],
      });
      if (this.playbackIntent) void this.play();
    });
    on('canplay', () => {
      if (this.status !== 'readyToPlay') {
        this.setStatus('readyToPlay');
        this.emit('statusChange', {
          status: 'readyToPlay',
          oldStatus: 'loading',
          error: null,
        });
      }
    });
    on('waiting', () => this.setStatus('loading'));
    on('loadstart', () => this.setStatus('loading'));
    on('playing', () => {
      this.emit('playingChange', { isPlaying: true, oldIsPlaying: false });
    });
    on('pause', () => {
      this.emit('playingChange', {
        isPlaying: false,
        oldIsPlaying: true,
      });
    });
    on('timeupdate', () => {
      this.emit('timeUpdate', {
        currentTime: this.element.currentTime,
        currentLiveTimestamp: null,
        currentOffsetFromLive: null,
        bufferedPosition: this.element.buffered.length
          ? this.element.buffered.end(this.element.buffered.length - 1)
          : 0,
      });
    });
    on('volumechange', () => {
      this.emit('volumeChange', {
        volume: this.element.volume,
        muted: this.element.muted,
      });
    });
    on('ratechange', () => {
      this.emit('playbackRateChange', { playbackRate: this.element.playbackRate });
    });
    on('ended', () => {
      this.playbackIntent = false;
      this.emit('playToEnd');
    });
    on('error', () => {
      const mediaError = this.element.error;
      this.setStatus('error');
      this.emit('statusChange', {
        status: 'error',
        oldStatus: 'loading',
        error: {
          message: mediaError?.message || 'The video could not be loaded',
          code: mediaError?.code,
        },
      });
    });
  }

  private setStatus(status: PlayerStatus) {
    if (this.status === status) return;
    const oldStatus = this.status;
    this.status = status;
    if (status === 'loading') {
      this.emit('statusChange', { status, oldStatus, error: null });
    }
  }

  private emit(event: string, payload?: any) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of [...listeners]) {
      try {
        listener(payload);
      } catch (error) {
        console.warn(`[expo-video shim] listener for "${event}" failed`, error);
      }
    }
  }

  addListener(event: string, listener: Listener) {
    const listeners = this.listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return { remove: () => listeners.delete(listener) };
  }

  setSource(source: PlayerSource) {
    this.source = source;
    const uri = normalizeUri(source);
    applyRequestHeaders(source);
    this.playbackIntent = this.playbackIntent || !this.element.paused;
    this.element.src = uri;
    this.element.load();
    this.setStatus(uri ? 'loading' : 'idle');
    if (uri) {
      this.emit('sourceChange', { source });
    }
  }

  get currentSource() {
    return this.source;
  }

  get playing() {
    return !this.element.paused && !this.element.ended && this.element.readyState > 2;
  }

  get statusValue() {
    return this.status;
  }

  get currentTime() {
    return this.element.currentTime;
  }

  set currentTime(value: number) {
    if (!Number.isFinite(value)) return;
    try {
      this.element.currentTime = Math.max(0, value);
    } catch {
      // The metadata is not available yet.
    }
  }

  get duration() {
    return Number.isFinite(this.element.duration) ? this.element.duration : 0;
  }

  get volume() {
    return this.element.volume;
  }

  set volume(value: number) {
    this.element.volume = Math.min(1, Math.max(0, value));
  }

  get muted() {
    return this.element.muted;
  }

  set muted(value: boolean) {
    this.element.muted = value;
  }

  get loop() {
    return this.element.loop;
  }

  set loop(value: boolean) {
    this.element.loop = value;
  }

  get playbackRate() {
    return this.element.playbackRate;
  }

  set playbackRate(value: number) {
    this.element.playbackRate = value;
  }

  get timeUpdateEventInterval() {
    return this.interval;
  }

  set timeUpdateEventInterval(value: number) {
    this.interval = value;
  }

  get preservesPitch() {
    return this.element.preservesPitch;
  }

  set preservesPitch(value: boolean) {
    this.element.preservesPitch = value;
  }

  // Accepted for API compatibility; there is no media notification in Electron.
  set showNowPlayingNotification(_value: boolean) {}
  set audioMixingMode(_value: unknown) {}
  set staysActiveInBackground(_value: boolean) {}

  play() {
    this.playbackIntent = true;
    const promise = this.element.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Autoplay can be blocked until the user interacts with the page.
      });
    }
  }

  pause() {
    this.playbackIntent = false;
    this.element.pause();
  }

  seekBy(seconds: number) {
    this.currentTime = this.element.currentTime + seconds;
  }

  replace(source: PlayerSource) {
    this.setSource(source);
  }

  async replaceAsync(source: PlayerSource) {
    this.setSource(source);
    await new Promise<void>(resolve => {
      const onReady = () => {
        this.element.removeEventListener('loadedmetadata', onReady);
        resolve();
      };
      this.element.addEventListener('loadedmetadata', onReady);
      window.setTimeout(onReady, 1500);
    });
  }

  async startPictureInPicture() {
    try {
      await this.element.requestPictureInPicture();
    } catch (error) {
      console.warn('[expo-video shim] unable to start Picture-in-Picture', error);
    }
  }

  dispose() {
    this.pause();
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.listeners.clear();
  }
}

export type VideoPlayer = WebVideoPlayer;

export const AudioMixingMode = {
  MixWithOthers: 'mixWithOthers',
  DuckOthers: 'duckOthers',
  DoNotMix: 'doNotMix',
  Auto: 'auto',
} as const;

export type AudioMixingMode = (typeof AudioMixingMode)[keyof typeof AudioMixingMode];

export const VideoContentFit = {
  CONTAIN: 'contain',
  COVER: 'cover',
  FILL: 'fill',
} as const;

export type VideoContentFit = (typeof VideoContentFit)[keyof typeof VideoContentFit];

export function useVideoPlayer(
  source: PlayerSource,
  setup?: (player: WebVideoPlayer) => void,
): WebVideoPlayer {
  const [player] = React.useState(() => new WebVideoPlayer());
  const setupRef = React.useRef(setup);
  setupRef.current = setup;

  // The setup callback is the expo-video contract: it runs once, when the
  // player is created, before the first source is loaded. Running it in an
  // effect (instead of during render) keeps React strict mode happy; this
  // effect is declared before the source effect so the order is preserved.
  const setupDone = React.useRef(false);
  React.useEffect(() => {
    if (setupDone.current) return;
    setupDone.current = true;
    setupRef.current?.(player);
  }, [player]);

  React.useEffect(() => {
    player.setSource(source);
    // `source` is intentionally compared through its serialised value so a new
    // object with identical contents does not reload the video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, normalizeUri(source), JSON.stringify(normalizeHeaders(source))]);

  return player;
}

export function VideoView({
  player,
  style,
  nativeControls = true,
  contentFit = 'contain',
  allowsPictureInPicture = true,
  onPictureInPictureStop,
  ...rest
}: VideoViewProps) {
  const hostRef: React.MutableRefObject<any> = React.useRef(null);
  const pipStopRef = React.useRef(onPictureInPictureStop);
  pipStopRef.current = onPictureInPictureStop;
  void rest;

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || !player?.element) return;

    const element = player.element;
    element.controls = nativeControls;
    element.style.objectFit = contentFit;
    element.disablePictureInPicture = !allowsPictureInPicture;
    host.appendChild(element);

    const handleLeavePiP = () => pipStopRef.current?.();
    element.addEventListener('leavepictureinpicture', handleLeavePiP);
    return () => {
      element.removeEventListener('leavepictureinpicture', handleLeavePiP);
      element.pause();
      element.remove();
    };
  }, [player, nativeControls, contentFit, allowsPictureInPicture]);

  return (
    <View
      ref={hostRef}
      style={[{ position: 'relative', overflow: 'hidden', backgroundColor: 'black' }, style]}
    />
  );
}

export default { useVideoPlayer, VideoView };
