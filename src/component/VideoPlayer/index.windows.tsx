/* eslint-disable react-compiler/react-compiler */
import Hls from 'hls.js';
import React, { memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

/**
 * Windows/Electron video player.
 *
 * The Android implementation (`index.tsx`) is built on top of expo-video,
 * reanimated and gesture-handler. None of those native modules exist in the
 * Electron renderer, so this file implements the whole player with a real
 * HTML5 <video> element, hls.js for HLS streams and a DOM based control UI.
 *
 * It is only selected by the Vite alias in `electron/vite.config.mjs`; Metro
 * keeps resolving `index.tsx` on Android.
 */

export type SubtitleItem = {
  startTime: number;
  endTime: number;
  text: string;
};

export type PlayerRef = {
  skipTo: (duration: number) => void;
  overwriteSubtitleObj: (obj: SubtitleItem[]) => void;
  play: () => void;
  pause: () => void;
  setPaused: (paused: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type ContentFit = 'contain' | 'cover' | 'fill';

type VideoPlayerProps = {
  title: string;
  thumbnailURL?: string;
  streamingURL: string;
  subtitleURL?: string;
  onSubtitleLoad?: (data: string) => void;
  style?: ViewStyle;
  videoRef?: React.RefObject<any>;
  ref?: React.Ref<PlayerRef>;
  onFullscreenUpdate?: (isFullscreen: boolean) => void;
  fullscreen?: boolean;
  onLoad?: () => void;
  isPaused?: boolean;
  onDurationChange?: (positionSecond: number) => void;
  headers?: Record<string, string>;
  batteryAndClock?: React.JSX.Element;
  isHls?: boolean;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const STORAGE_KEYS = {
  volume: 'aniflix.player.volume',
  muted: 'aniflix.player.muted',
  rate: 'aniflix.player.rate',
  fit: 'aniflix.player.fit',
  loop: 'aniflix.player.loop',
  subtitles: 'aniflix.player.subtitles',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readString = (key: string, fallback: string) => {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const readNumber = (key: string, fallback: number) => {
  const value = Number(readString(key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
};

const readBool = (key: string, fallback: boolean) => {
  const value = readString(key, String(fallback));
  return value === 'true';
};

const readFit = (): ContentFit => {
  const value = readString(STORAGE_KEYS.fit, 'contain');
  return value === 'cover' || value === 'fill' ? value : 'contain';
};

const writeSetting = (key: string, value: string | number | boolean) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Persisting settings is best effort only.
  }
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const sec = total % 60;
  const min = Math.floor(total / 60);
  const hour = Math.floor(min / 60);
  const mm = String(min % 60).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return hour > 0 ? `${String(hour).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
};

const isHlsUrl = (url: string) => /\.m3u8(\?|#|$)/i.test(url);

const RE_BLOCK =
  /(?:\d+\s+)?((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3})\s+(?:-->|--&gt;)\s+((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3})[^\n\r]*\s+([\s\S]*?)(?=\s*(?:\d+\s+)?(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}|$)/g;
const RE_TAGS = /\{[^}]*\}|<\/?[^>]+>/g;
const RE_ASS_NL = /\\N/g;

const toSeconds = (value: string): number => {
  if (!value) return 0;
  const [timePart, msPart = '0'] = value.trim().replace(',', '.').split('.');
  const units = timePart.split(':').map(Number);
  let seconds = 0;
  if (units.length === 3) seconds = units[0] * 3600 + units[1] * 60 + units[2];
  else if (units.length === 2) seconds = units[0] * 60 + units[1];
  else if (units.length === 1) seconds = units[0];
  return seconds + Number(msPart.padEnd(3, '0').slice(0, 3)) / 1000;
};

export const parseSubtitles = async (raw: string): Promise<SubtitleItem[]> => {
  const result: SubtitleItem[] = [];
  let match: RegExpExecArray | null;
  RE_BLOCK.lastIndex = 0;

  while ((match = RE_BLOCK.exec(raw)) !== null) {
    let start = toSeconds(match[1]);
    let end = toSeconds(match[2]);
    const lines = match[3].split(/\r?\n/);
    const cleaned: string[] = [];

    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (
        line.toUpperCase().startsWith('WEBVTT') ||
        line.toUpperCase().startsWith('NOTE') ||
        line.toUpperCase().startsWith('X-TIMESTAMP')
      ) {
        continue;
      }
      line = line
        .replace(/WEBVTT/gi, '')
        .replace(RE_ASS_NL, ' ')
        .replace(RE_TAGS, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\\h/g, ' ')
        .trim();
      if (line.length > 0) cleaned.push(line);
    }

    const text = cleaned.join('\n');
    if (!text) continue;

    if (start > end) {
      if (start - end > 30_000) {
        start -= Math.round((start - end) / 3600) * 3600;
      } else {
        start = Math.max(0, end - 3);
      }
    }
    if (end - start > 10) end = start + 4;

    result.push({ startTime: start, endTime: end, text });
  }

  return result;
};

const formatSubtitleTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const pad = (num: number, size = 2) => String(num).padStart(size, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
};

export const stringifySubtitles = async (items: SubtitleItem[]): Promise<string> => {
  const blocks = items.map((item, index) => {
    const encoded = item.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `${index + 1}\n${formatSubtitleTime(item.startTime)} --> ${formatSubtitleTime(
      item.endTime,
    )}\n${encoded}`;
  });
  return `WEBVTT\n\n${blocks.join('\n\n')}`;
};

const decodeSubtitleBuffer = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer);
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer);
  }
  let nullBytes = 0;
  const sampleSize = Math.min(bytes.length, 100);
  for (let i = 0; i < sampleSize; i++) {
    if (bytes[i] === 0) nullBytes++;
  }
  return new TextDecoder(nullBytes > sampleSize * 0.2 ? 'utf-16le' : 'utf-8').decode(buffer);
};

const collectActiveSubtitles = (
  list: SubtitleItem[] | null,
  time: number,
  enabled: boolean,
): string[] => {
  if (!list || !enabled) return [];
  const active: string[] = [];
  for (const subtitle of list) {
    if (subtitle.startTime > time) break;
    if (time >= subtitle.startTime && time <= subtitle.endTime) active.push(subtitle.text);
  }
  return active;
};

const ICONS = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  replay:
    'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
  volume:
    'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  mute: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
  fullscreen: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  fullscreenExit: 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
  settings:
    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  captions:
    'M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z',
  captionsOff:
    'M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zM3.5 2.7L2.2 4l17.8 17.8 1.3-1.3L3.5 2.7z',
  pip: 'M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z',
  fit: 'M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z',
  loop: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  error:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  refresh:
    'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
} as const;

const SvgIcon = ({
  d,
  size = 22,
  style,
}: {
  d: string;
  size?: number;
  style?: React.CSSProperties;
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    style={{ display: 'block', flex: 'none', ...style }}>
    <path d={d} />
  </svg>
);

const PLAYER_CSS = `
.afp-root, .afp-root * { box-sizing: border-box; }
.afp-root { position:relative; width:100%; height:100%; background:#000; overflow:hidden; color:#fff; font-family:"Segoe UI", system-ui, -apple-system, sans-serif; user-select:none; }
.afp-root:focus { outline:none; }
.afp-root.afp-nocursor { cursor:none; }
.afp-video { position:absolute; inset:0; width:100%; height:100%; display:block; background:#000; }
.afp-top { position:absolute; top:0; left:0; right:0; z-index:5; display:flex; align-items:flex-start; gap:10px; padding:12px 16px 36px; background:linear-gradient(to bottom, rgba(0,0,0,.74), rgba(0,0,0,0)); pointer-events:none; transition:opacity .18s ease; }
.afp-top > * { pointer-events:auto; }
.afp-title { flex:1; min-width:0; padding-top:4px; font-size:15px; font-weight:600; line-height:1.35; text-shadow:0 1px 3px rgba(0,0,0,.85); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.afp-btn { appearance:none; border:0; background:transparent; color:#fff; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:8px; cursor:pointer; opacity:.92; transition:background .12s ease, transform .12s ease, opacity .12s ease; }
.afp-btn:hover { background:rgba(255,255,255,.16); opacity:1; }
.afp-btn:active { transform:scale(.94); }
.afp-btn:focus-visible { outline:2px solid #4dd0e1; outline-offset:1px; }
.afp-btn[disabled] { opacity:.35; cursor:default; }
.afp-btn-text { font-size:12px; font-weight:700; padding:8px 7px; font-variant-numeric:tabular-nums; }
.afp-center { position:absolute; inset:0; z-index:3; display:flex; align-items:center; justify-content:center; gap:32px; pointer-events:none; transition:opacity .18s ease; }
.afp-center .afp-btn { pointer-events:auto; }
.afp-big { width:70px; height:70px; border-radius:50%; background:rgba(0,0,0,.48); box-shadow:0 4px 22px rgba(0,0,0,.35); backdrop-filter:blur(4px); }
.afp-big:hover { background:rgba(0,0,0,.66); }
.afp-skip { position:relative; width:54px; height:54px; border-radius:50%; background:rgba(0,0,0,.34); }
.afp-skip span { position:absolute; bottom:8px; left:0; right:0; text-align:center; font-size:9px; font-weight:700; letter-spacing:.02em; }
.afp-bottom { position:absolute; left:0; right:0; bottom:0; z-index:5; padding:48px 12px 8px; background:linear-gradient(to top, rgba(0,0,0,.86), rgba(0,0,0,.4) 58%, rgba(0,0,0,0)); transition:opacity .18s ease; }
.afp-row { display:flex; align-items:center; gap:1px; padding:3px 2px 0; }
.afp-time { padding:0 7px; font-size:12px; color:#f2f2f2; white-space:nowrap; font-variant-numeric:tabular-nums; }
.afp-time .dim { color:#9d9d9d; }
.afp-spacer { flex:1; }
.afp-volume { display:flex; align-items:center; gap:1px; }
.afp-progress { position:relative; display:flex; align-items:center; height:20px; margin:0 4px; cursor:pointer; touch-action:none; }
.afp-track { position:relative; width:100%; height:4px; border-radius:3px; background:rgba(255,255,255,.26); transition:height .12s ease; }
.afp-progress:hover .afp-track, .afp-progress[data-seeking="true"] .afp-track { height:6px; }
.afp-buffer { position:absolute; left:0; top:0; bottom:0; border-radius:3px; background:rgba(255,255,255,.34); }
.afp-played { position:absolute; left:0; top:0; bottom:0; border-radius:3px; background:#4dd0e1; }
.afp-thumb { position:absolute; top:50%; width:13px; height:13px; margin-left:-6.5px; border-radius:50%; background:#4dd0e1; box-shadow:0 0 0 3px rgba(77,208,225,.28); transform:translateY(-50%) scale(0); transition:transform .12s ease; }
.afp-progress:hover .afp-thumb, .afp-progress[data-seeking="true"] .afp-thumb { transform:translateY(-50%) scale(1); }
.afp-progress-tip { position:absolute; bottom:23px; transform:translateX(-50%); padding:2px 7px; border:1px solid rgba(255,255,255,.14); border-radius:4px; background:rgba(0,0,0,.88); font-size:11px; white-space:nowrap; pointer-events:none; font-variant-numeric:tabular-nums; }
.afp-range { appearance:none; -webkit-appearance:none; height:4px; border-radius:2px; outline:none; cursor:pointer; background:linear-gradient(to right, #4dd0e1 var(--afp-fill, 100%), rgba(255,255,255,.3) var(--afp-fill, 100%)); }
.afp-range::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:12px; height:12px; border:0; border-radius:50%; background:#fff; box-shadow:0 0 3px rgba(0,0,0,.65); }
.afp-range::-moz-range-thumb { width:12px; height:12px; border:0; border-radius:50%; background:#fff; }
.afp-vol-range { width:84px; margin:0 6px; }
.afp-subtitles { position:absolute; left:5%; right:5%; z-index:2; display:flex; flex-direction:column; align-items:center; gap:2px; pointer-events:none; text-align:center; transition:bottom .18s ease; }
.afp-sub-line { display:inline-block; padding:1px 8px 2px; border-radius:4px; background:rgba(0,0,0,.55); color:#fff; font-weight:600; line-height:1.32; text-shadow:0 1px 2px #000, 0 0 6px rgba(0,0,0,.9); white-space:pre-line; }
.afp-settings { position:absolute; right:12px; bottom:76px; z-index:8; width:272px; max-height:calc(100% - 118px); overflow:auto; padding:10px; border:1px solid rgba(255,255,255,.1); border-radius:10px; background:rgba(22,22,26,.97); box-shadow:0 12px 34px rgba(0,0,0,.6); backdrop-filter:blur(12px); }
.afp-settings h4 { margin:2px 4px 8px; color:#9e9e9e; font-size:11px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
.afp-setting-group { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px; }
.afp-option { padding:5px 9px; border:1px solid rgba(255,255,255,.14); border-radius:6px; background:rgba(255,255,255,.04); color:#ddd; font-size:12px; cursor:pointer; transition:background .12s ease; }
.afp-option:hover { background:rgba(255,255,255,.12); }
.afp-option.active { border-color:#4dd0e1; background:#4dd0e1; color:#062126; font-weight:700; }
.afp-setting-row { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:7px 4px; color:#e0e0e0; font-size:13px; }
.afp-switch { position:relative; flex:none; width:36px; height:20px; border:0; border-radius:20px; background:rgba(255,255,255,.22); cursor:pointer; }
.afp-switch.active { background:#4dd0e1; }
.afp-switch::after { content:''; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .15s ease; }
.afp-switch.active::after { transform:translateX(16px); }
.afp-overlay { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:24px; background:rgba(0,0,0,.58); text-align:center; }
.afp-overlay.afp-overlay-clear { background:rgba(0,0,0,.16); pointer-events:none; }
.afp-spinner { width:44px; height:44px; border:3px solid rgba(255,255,255,.22); border-top-color:#4dd0e1; border-radius:50%; animation:afp-spin .8s linear infinite; }
@keyframes afp-spin { to { transform:rotate(360deg); } }
.afp-error-title { font-size:15px; font-weight:700; }
.afp-error-text { max-width:540px; color:#ffb4ab; font-size:13px; line-height:1.5; }
.afp-flash { position:absolute; left:50%; top:13%; z-index:9; transform:translateX(-50%); padding:7px 14px; border:1px solid rgba(255,255,255,.12); border-radius:20px; background:rgba(0,0,0,.8); color:#fff; font-size:13px; font-weight:600; white-space:nowrap; pointer-events:none; animation:afp-flash-in .15s ease; }
@keyframes afp-flash-in { from { opacity:0; transform:translate(-50%, -4px); } to { opacity:1; transform:translate(-50%, 0); } }
.afp-hidden { opacity:0 !important; pointer-events:none !important; }
.afp-hidden *, .afp-hidden *:hover { pointer-events:none !important; }
`;

function VideoPlayer({
  title,
  thumbnailURL,
  streamingURL,
  subtitleURL,
  onSubtitleLoad,
  style,
  onFullscreenUpdate,
  fullscreen,
  onLoad,
  isPaused,
  onDurationChange,
  headers,
  batteryAndClock,
  ref,
  isHls = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const pausedRef = useRef(isPaused ?? false);
  const fullscreenRef = useRef(fullscreen ?? false);
  const showControlsRef = useRef(true);
  const showSettingsRef = useRef(false);
  const subtitleEnabledRef = useRef(true);
  const suppressFullscreenEventRef = useRef(false);
  const lastMoveRef = useRef(0);
  const lastSubtitleKeyRef = useRef('');
  const subtitlesRef = useRef<SubtitleItem[] | null>(null);

  const onDurationChangeRef = useRef(onDurationChange);
  onDurationChangeRef.current = onDurationChange;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const onSubtitleLoadRef = useRef(onSubtitleLoad);
  onSubtitleLoadRef.current = onSubtitleLoad;
  const onFullscreenUpdateRef = useRef(onFullscreenUpdate);
  onFullscreenUpdateRef.current = onFullscreenUpdate;

  const [paused, setPaused] = useState(isPaused ?? false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState<{ time: number; x: number } | null>(null);
  const [volume, setVolume] = useState(() => clamp(readNumber(STORAGE_KEYS.volume, 1), 0, 1));
  const [muted, setMuted] = useState(() => readBool(STORAGE_KEYS.muted, false));
  const [playbackRate, setPlaybackRate] = useState(() =>
    SPEEDS.includes(readNumber(STORAGE_KEYS.rate, 1)) ? readNumber(STORAGE_KEYS.rate, 1) : 1,
  );
  const [contentFit, setContentFit] = useState<ContentFit>(readFit);
  const [loop, setLoop] = useState(() => readBool(STORAGE_KEYS.loop, false));
  const [subtitles, setSubtitles] = useState<SubtitleItem[] | null>(null);
  const [currentSubtitles, setCurrentSubtitles] = useState<string[]>([]);
  const [subtitleError, setSubtitleError] = useState(false);
  const [subtitleRetry, setSubtitleRetry] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(() =>
    readBool(STORAGE_KEYS.subtitles, true),
  );
  const [showSettings, setShowSettings] = useState(false);
  const [flash, setFlash] = useState('');
  const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
  const [activeLevel, setActiveLevel] = useState(-1);
  const [compact, setCompact] = useState(false);
  const [sourceToken, setSourceToken] = useState(0);

  fullscreenRef.current = fullscreen ?? false;
  showControlsRef.current = showControls;
  showSettingsRef.current = showSettings;
  subtitleEnabledRef.current = subtitlesEnabled;

  const flashMessage = useCallback((message: string) => {
    setFlash(message);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(''), 1500);
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (pausedRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      if (!pausedRef.current && !seekingRef.current && !showSettingsRef.current) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  const wakeControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const doPlay = useCallback(() => {
    const video = videoElRef.current;
    pausedRef.current = false;
    if (!video || !video.src) return;
    video.play().catch((error: any) => {
      if (error?.name === 'AbortError') return;
      pausedRef.current = true;
      setShowControls(true);
      setPaused(true);
      setIsBuffering(false);
      flashMessage('Klik untuk memutar video');
    });
  }, [flashMessage]);

  const doPause = useCallback(() => {
    pausedRef.current = true;
    videoElRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (videoElRef.current?.paused) doPlay();
    else doPause();
  }, [doPause, doPlay]);

  const seekTo = useCallback((time: number) => {
    const video = videoElRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) ? video.duration : 0;
    const next = clamp(time, 0, max || time);
    try {
      video.currentTime = next;
      setCurrentTime(next);
      onDurationChangeRef.current?.(next);
      const active = collectActiveSubtitles(subtitlesRef.current, next, subtitleEnabledRef.current);
      const key = active.join('|');
      if (key !== lastSubtitleKeyRef.current) {
        lastSubtitleKeyRef.current = key;
        setCurrentSubtitles(active);
      }
    } catch {
      // Metadata may not be available yet.
    }
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoElRef.current;
      if (!video) return;
      const next = clamp(video.currentTime + delta, 0, video.duration || 0);
      seekTo(next);
      flashMessage(`${delta > 0 ? '+' : ''}${Math.round(delta)} detik`);
    },
    [flashMessage, seekTo],
  );

  const applyVolume = useCallback(
    (value: number) => {
      const video = videoElRef.current;
      const next = clamp(value, 0, 1);
      setVolume(next);
      setMuted(next === 0);
      if (video) {
        video.volume = next;
        video.muted = next === 0;
      }
      writeSetting(STORAGE_KEYS.volume, next);
      writeSetting(STORAGE_KEYS.muted, next === 0);
      flashMessage(next === 0 ? 'Bisu' : `Volume ${Math.round(next * 100)}%`);
    },
    [flashMessage],
  );

  const toggleMute = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    if (!next && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
      writeSetting(STORAGE_KEYS.volume, 0.5);
    }
    setMuted(next);
    writeSetting(STORAGE_KEYS.muted, next);
    flashMessage(next ? 'Bisu' : 'Suara aktif');
  }, [flashMessage]);

  const applyRate = useCallback(
    (rate: number) => {
      setPlaybackRate(rate);
      if (videoElRef.current) videoElRef.current.playbackRate = rate;
      writeSetting(STORAGE_KEYS.rate, rate);
      flashMessage(`${rate}×`);
    },
    [flashMessage],
  );

  const cycleRate = useCallback(() => {
    const index = SPEEDS.indexOf(playbackRate);
    applyRate(SPEEDS[(index + 1) % SPEEDS.length]);
  }, [applyRate, playbackRate]);

  const applyFit = useCallback(
    (fit: ContentFit) => {
      setContentFit(fit);
      writeSetting(STORAGE_KEYS.fit, fit);
      flashMessage(
        fit === 'contain' ? 'Rasio: Fit' : fit === 'cover' ? 'Rasio: Isi' : 'Rasio: Regang',
      );
    },
    [flashMessage],
  );

  const toggleSubtitles = useCallback(() => {
    setSubtitlesEnabled(enabled => {
      writeSetting(STORAGE_KEYS.subtitles, !enabled);
      return !enabled;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wasFullscreen = fullscreenRef.current;
    onFullscreenUpdateRef.current?.(wasFullscreen);
    const root = containerRef.current;
    if (!root) return;
    if (!wasFullscreen) {
      if (document.fullscreenElement !== root && root.requestFullscreen) {
        root.requestFullscreen().catch(() => undefined);
      }
    } else if (document.fullscreenElement === root) {
      suppressFullscreenEventRef.current = true;
      document
        .exitFullscreen()
        .catch(() => undefined)
        .finally(() => {
          window.setTimeout(() => {
            suppressFullscreenEventRef.current = false;
          }, 60);
        });
    }
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoElRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      flashMessage('Picture-in-Picture tidak tersedia');
      return;
    }
    try {
      if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      flashMessage('Tidak dapat membuka Picture-in-Picture');
    }
  }, [flashMessage]);

  const setQuality = useCallback(
    (index: number) => {
      const hls = hlsRef.current;
      if (!hls) return;
      hls.currentLevel = index;
      hls.nextLevel = index;
      setActiveLevel(index);
      const label = index < 0 ? 'Otomatis' : levels.find(level => level.index === index)?.label;
      flashMessage(`Kualitas: ${label ?? 'Otomatis'}`);
    },
    [flashMessage, levels],
  );

  const retrySource = useCallback(() => {
    setIsError(false);
    setErrorMessage('');
    setIsBuffering(true);
    setSourceToken(token => token + 1);
  }, []);

  const handleSeekTime = useCallback(
    (clientX: number) => {
      const bar = seekBarRef.current;
      const video = videoElRef.current;
      if (!bar || !video || !duration) return null;
      const rect = bar.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return { time: ratio * duration, ratio };
    },
    [duration],
  );

  const handleSeekPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!duration) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      seekingRef.current = true;
      setIsSeeking(true);
      const target = handleSeekTime(event.clientX);
      if (target) seekTo(target.time);
    },
    [duration, handleSeekTime, seekTo],
  );

  const handleSeekPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!duration) return;
      const target = handleSeekTime(event.clientX);
      if (!target) return;
      const rect = seekBarRef.current!.getBoundingClientRect();
      setSeekPreview({ time: target.time, x: event.clientX - rect.left });
      if (seekingRef.current) seekTo(target.time);
    },
    [duration, handleSeekTime, seekTo],
  );

  const handleSeekPointerUp = useCallback(() => {
    if (!seekingRef.current) return;
    seekingRef.current = false;
    setIsSeeking(false);
    setSeekPreview(null);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const handleMouseMove = useCallback(() => {
    if (!showControlsRef.current) {
      setShowControls(true);
    }
    const now = Date.now();
    if (now - lastMoveRef.current < 200) return;
    lastMoveRef.current = now;
    scheduleHideControls();
  }, [scheduleHideControls]);

  const handleVideoClick = useCallback(() => {
    if (showSettingsRef.current) {
      setShowSettings(false);
      return;
    }
    if (!showControlsRef.current) {
      wakeControls();
      return;
    }
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      togglePlay();
    }, 200);
  }, [togglePlay, wakeControls]);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest('button, input, select, .afp-settings')) return;
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      toggleFullscreen();
    },
    [toggleFullscreen],
  );

  // __EFFECTS__
  subtitlesRef.current = subtitles;
  const onLoadCalledRef = useRef(false);
  const headersKey = JSON.stringify(headers ?? {});

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCompact(width > 0 && width < 640);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    };
  }, []);

  // Keep the display awake while a video is open. The blocker lives in the
  // Electron main process; the renderer only owns its id.
  useEffect(() => {
    const power = (window as any).electronAPI?.power;
    let disposed = false;
    let blockerId: number | null = null;

    const stopBlocker = (id: number) => {
      Promise.resolve(power?.stopBlocker?.(id)).catch(() => undefined);
    };

    Promise.resolve(power?.startBlocker?.())
      .then((result: { id?: number } | undefined) => {
        if (!disposed) {
          blockerId = result?.id ?? null;
          return;
        }
        if (result?.id !== undefined) stopBlocker(result.id);
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      if (blockerId !== null) stopBlocker(blockerId);
    };
  }, []);

  // Loads the current source. HLS streams go through hls.js (the renderer does
  // not ship Chromium's proprietary native HLS support) while progressive MP4
  // files can be attached to the element directly.
  useEffect(() => {
    const video = videoElRef.current;
    if (!video) return;
    const url = streamingURL;

    onLoadCalledRef.current = false;
    setIsError(false);
    setErrorMessage('');
    setIsBuffering(true);
    setDuration(0);
    setCurrentTime(0);
    setBuffered(0);
    setLevels([]);
    setActiveLevel(-1);
    setCurrentSubtitles([]);
    setSeekPreview(null);
    lastSubtitleKeyRef.current = '';

    const previousHls = hlsRef.current;
    hlsRef.current = null;
    previousHls?.destroy();

    try {
      video.removeAttribute('src');
      video.load();
    } catch {
      // Ignore a failed reset; the new source is assigned below.
    }

    if (!url) {
      setIsError(true);
      setErrorMessage('URL video tidak tersedia.');
      setIsBuffering(false);
      return;
    }

    try {
      void (window as any).electronAPI?.media?.setHeaders?.({
        url,
        headers: headers ?? {},
      });
    } catch {
      // The DOM player still works without the header bridge.
    }

    const applyXhrHeaders = (xhr: XMLHttpRequest) => {
      for (const [key, value] of Object.entries(headers ?? {})) {
        try {
          xhr.setRequestHeader(key, value);
        } catch {
          // Some headers (Referer, Origin, User-Agent) are browser controlled.
          // Electron's webRequest bridge applies those instead.
        }
      }
    };

    const hlsLike = isHls || isHlsUrl(url);

    if (hlsLike && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        xhrSetup: applyXhrHeaders,
      });
      hlsRef.current = hls;

      let recovered = 0;

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const seen = new Map<string, number>();
        setLevels(
          data.levels.map((level, index) => {
            let label = level.height
              ? `${level.height}p`
              : `${Math.round(level.bitrate / 1000)} kbps`;
            const duplicates = seen.get(label) ?? 0;
            seen.set(label, duplicates + 1);
            if (duplicates > 0) label += ` (${Math.round(level.bitrate / 1000)}k)`;
            return { index, label };
          }),
        );
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setActiveLevel(hls.autoLevelEnabled ? -1 : data.level);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recovered < 2) {
          recovered++;
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recovered < 2) {
          recovered++;
          hls.recoverMediaError();
          return;
        }
        setErrorMessage(`Stream HLS tidak dapat dimuat (${data.details}).`);
        setIsError(true);
        setIsBuffering(false);
      });

      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (hlsLike && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.load();
    } else if (hlsLike) {
      setIsError(true);
      setErrorMessage('Browser ini tidak mendukung pemutaran HLS.');
      setIsBuffering(false);
    } else {
      video.src = url;
      video.load();
    }

    return () => {
      const hls = hlsRef.current;
      if (hls) {
        hlsRef.current = null;
        hls.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingURL, isHls, headersKey, sourceToken]);

  // Media element events. Everything reads mutable refs so the listeners are
  // attached exactly once and never miss an event because of a re-render.
  useEffect(() => {
    const video = videoElRef.current;
    if (!video) return;

    const updateActiveSubtitles = (time: number) => {
      const active = collectActiveSubtitles(subtitlesRef.current, time, subtitleEnabledRef.current);
      const key = active.join('|');
      if (key !== lastSubtitleKeyRef.current) {
        lastSubtitleKeyRef.current = key;
        setCurrentSubtitles(active);
      }
    };

    const updateBuffered = () => {
      const ranges = video.buffered;
      setBuffered(ranges.length ? ranges.end(ranges.length - 1) : 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setIsBuffering(false);
      updateBuffered();
      updateActiveSubtitles(video.currentTime);
      onDurationChangeRef.current?.(video.currentTime);

      if (!onLoadCalledRef.current) {
        onLoadCalledRef.current = true;
        onLoadRef.current?.();
      }
      if (!pausedRef.current) {
        void video.play().catch(() => {
          setShowControls(true);
        });
      }
    };

    const handleDurationChange = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };

    const handleTimeUpdate = () => {
      if (!seekingRef.current) setCurrentTime(video.currentTime);
      updateActiveSubtitles(video.currentTime);
      onDurationChangeRef.current?.(video.currentTime);
    };

    const handlePlay = () => {
      pausedRef.current = false;
      setPaused(false);
      setIsBuffering(false);
    };

    const handlePause = () => {
      pausedRef.current = true;
      setPaused(true);
      setShowControls(true);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      pausedRef.current = false;
      setIsBuffering(false);
      setPaused(false);
    };
    const handleCanPlay = () => setIsBuffering(false);
    const handleSeeking = () => setIsBuffering(true);
    const handleSeeked = () => setIsBuffering(false);

    const handleEnded = () => {
      pausedRef.current = true;
      setPaused(true);
      setIsBuffering(false);
      setShowControls(true);
    };

    const handleError = () => {
      if (!video.currentSrc && !video.src) return;
      const code = video.error?.code;
      const message =
        code === 1
          ? 'Pemuatan video dibatalkan.'
          : code === 2
            ? 'Terjadi kesalahan jaringan saat memuat video.'
            : code === 3
              ? 'Video tidak dapat didekode oleh perangkat ini.'
              : code === 4
                ? 'Format video tidak didukung atau sumber sudah tidak tersedia.'
                : video.error?.message || 'Terjadi kesalahan saat memutar video.';
      setErrorMessage(message);
      setIsError(true);
      setIsBuffering(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', updateBuffered);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Keep the playback intent in sync with the parent (loading overlays pause
  // the video through this prop).
  useEffect(() => {
    pausedRef.current = isPaused ?? false;
    const video = videoElRef.current;
    if (!video) return;
    if (isPaused) {
      video.pause();
    } else if (video.src) {
      void video.play().catch(() => undefined);
    }
  }, [isPaused]);

  useEffect(() => {
    const video = videoElRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    if (videoElRef.current) videoElRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (videoElRef.current) videoElRef.current.loop = loop;
  }, [loop]);

  useEffect(() => {
    if (!subtitlesEnabled) {
      lastSubtitleKeyRef.current = '';
      setCurrentSubtitles([]);
    }
  }, [subtitlesEnabled]);

  // Subtitle download + parsing. The shared parse function is also exported
  // below because Video_Film uses it to re-inject translated subtitles.
  useEffect(() => {
    if (!subtitleURL) {
      setSubtitles(null);
      setSubtitleError(false);
      setCurrentSubtitles([]);
      lastSubtitleKeyRef.current = '';
      return;
    }

    const controller = new AbortController();
    setSubtitles(null);
    setSubtitleError(false);
    setCurrentSubtitles([]);
    lastSubtitleKeyRef.current = '';

    fetch(subtitleURL, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(buffer => {
        const text = decodeSubtitleBuffer(buffer);
        onSubtitleLoadRef.current?.(text);
        return parseSubtitles(text);
      })
      .then(items => {
        if (controller.signal.aborted) return;
        setSubtitles(items);
        const active = collectActiveSubtitles(
          items,
          videoElRef.current?.currentTime ?? 0,
          subtitleEnabledRef.current,
        );
        lastSubtitleKeyRef.current = active.join('|');
        setCurrentSubtitles(active);
      })
      .catch((error: any) => {
        if (error?.name === 'AbortError') return;
        setSubtitleError(true);
        flashMessage('Gagal memuat subtitle');
      });

    return () => controller.abort();
  }, [subtitleURL, subtitleRetry, flashMessage]);

  useEffect(() => {
    if (paused || isError) {
      setShowControls(true);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    } else {
      scheduleHideControls();
    }
  }, [paused, isError, scheduleHideControls]);

  useEffect(() => {
    if (showSettings) {
      setShowControls(true);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    } else {
      scheduleHideControls();
    }
  }, [showSettings, scheduleHideControls]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const root = containerRef.current;
      const isNativeFullscreen = !!root && document.fullscreenElement === root;
      if (!isNativeFullscreen && !suppressFullscreenEventRef.current && fullscreenRef.current) {
        onFullscreenUpdateRef.current?.(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!fullscreen && document.fullscreenElement === containerRef.current) {
      suppressFullscreenEventRef.current = true;
      void document
        .exitFullscreen()
        .catch(() => undefined)
        .finally(() => {
          window.setTimeout(() => {
            suppressFullscreenEventRef.current = false;
          }, 60);
        });
    }
  }, [fullscreen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.isContentEditable)
      ) {
        return;
      }

      const video = videoElRef.current;
      if (!video) return;
      const key = event.key;
      let handled = true;

      switch (key) {
        case ' ':
        case 'k':
        case 'K':
          togglePlay();
          break;
        case 'ArrowLeft':
          seekBy(event.shiftKey ? -10 : -5);
          break;
        case 'ArrowRight':
          seekBy(event.shiftKey ? 10 : 5);
          break;
        case 'ArrowUp':
          applyVolume(video.volume + 0.05);
          break;
        case 'ArrowDown':
          applyVolume(video.volume - 0.05);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'c':
        case 'C':
          if (subtitleURL) {
            toggleSubtitles();
            flashMessage(subtitlesEnabled ? 'Subtitle nonaktif' : 'Subtitle aktif');
          } else {
            flashMessage('Subtitle tidak tersedia');
          }
          break;
        case 'p':
        case 'P':
          void togglePip();
          break;
        case 's':
        case 'S':
          setShowSettings(value => !value);
          break;
        case 'Home':
          seekTo(0);
          break;
        case 'End':
          seekTo(video.duration || 0);
          break;
        case 'Escape':
          if (showSettingsRef.current) setShowSettings(false);
          else if (fullscreenRef.current) onFullscreenUpdateRef.current?.(true);
          else handled = false;
          break;
        default:
          if (/^[0-9]$/.test(key) && Number.isFinite(video.duration)) {
            seekTo((Number(key) / 10) * video.duration);
          } else {
            handled = false;
          }
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
        wakeControls();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    applyVolume,
    flashMessage,
    seekBy,
    seekTo,
    subtitleURL,
    subtitlesEnabled,
    toggleFullscreen,
    toggleMute,
    togglePip,
    togglePlay,
    toggleSubtitles,
    wakeControls,
  ]);

  const controlsVisible = showControls || paused || isError;
  const hasSubtitles = !!subtitleURL || (subtitles?.length ?? 0) > 0;
  const progressPercent = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
  const bufferedPercent = duration > 0 ? clamp((buffered / duration) * 100, 0, 100) : 0;

  useImperativeHandle(
    ref,
    () => ({
      skipTo: (position: number) => seekTo(position),
      overwriteSubtitleObj: (obj: SubtitleItem[]) => {
        setSubtitles(obj);
        const active = collectActiveSubtitles(
          obj,
          videoElRef.current?.currentTime ?? 0,
          subtitleEnabledRef.current,
        );
        lastSubtitleKeyRef.current = active.join('|');
        setCurrentSubtitles(active);
      },
      play: doPlay,
      pause: doPause,
      setPaused: (nextPaused: boolean) => {
        if (nextPaused) doPause();
        else doPlay();
      },
      getCurrentTime: () => videoElRef.current?.currentTime ?? 0,
      getDuration: () => {
        const value = videoElRef.current?.duration;
        return Number.isFinite(value) ? (value as number) : 0;
      },
    }),
    [doPause, doPlay, seekTo],
  );

  return (
    <View style={[style, { position: 'relative', overflow: 'hidden', backgroundColor: '#000' }]}>
      <div
        ref={containerRef}
        className={`afp-root${!controlsVisible ? ' afp-nocursor' : ''}`}
        tabIndex={0}
        onMouseMove={handleMouseMove}
        onMouseLeave={scheduleHideControls}
        onDoubleClick={handleDoubleClick}
        onContextMenu={event => event.preventDefault()}>
        <style>{PLAYER_CSS}</style>

        <video
          ref={videoElRef}
          className="afp-video"
          style={{ objectFit: contentFit }}
          poster={thumbnailURL}
          playsInline
          preload="auto"
          onClick={handleVideoClick}
          onDoubleClick={event => {
            event.stopPropagation();
            handleDoubleClick(event);
          }}
          onDragStart={event => event.preventDefault()}
          onContextMenu={event => event.preventDefault()}
        />

        {batteryAndClock}

        <div className={`afp-top${controlsVisible ? '' : ' afp-hidden'}`}>
          <div className="afp-title">{title}</div>
          <button
            className="afp-btn"
            title="Picture-in-Picture (P)"
            onClick={event => {
              event.stopPropagation();
              void togglePip();
            }}>
            <SvgIcon d={ICONS.pip} />
          </button>
          <button
            className="afp-btn"
            title="Pengaturan (S)"
            onClick={event => {
              event.stopPropagation();
              setShowSettings(value => !value);
            }}>
            <SvgIcon d={ICONS.settings} />
          </button>
        </div>

        {subtitlesEnabled && currentSubtitles.length > 0 && !isError && (
          <div
            className="afp-subtitles"
            style={{ bottom: controlsVisible ? (compact ? 74 : 92) : 24 }}>
            {currentSubtitles.map((text, index) => (
              <span
                className="afp-sub-line"
                key={`${index}-${text.slice(0, 16)}`}
                style={{ fontSize: compact ? 16 : 20 }}>
                {text}
              </span>
            ))}
          </div>
        )}

        <div className={`afp-center${controlsVisible ? '' : ' afp-hidden'}`}>
          <button
            className="afp-btn afp-skip"
            title="Mundur 10 detik (←)"
            onClick={event => {
              event.stopPropagation();
              seekBy(-10);
            }}>
            <SvgIcon d={ICONS.replay} size={25} />
            <span>10</span>
          </button>
          <button
            className="afp-btn afp-big"
            title={paused ? 'Putar (Spasi)' : 'Jeda (Spasi)'}
            onClick={event => {
              event.stopPropagation();
              togglePlay();
            }}>
            <SvgIcon d={paused ? ICONS.play : ICONS.pause} size={36} />
          </button>
          <button
            className="afp-btn afp-skip"
            title="Maju 10 detik (→)"
            onClick={event => {
              event.stopPropagation();
              seekBy(10);
            }}>
            <SvgIcon d={ICONS.replay} size={25} style={{ transform: 'scaleX(-1)' }} />
            <span>10</span>
          </button>
        </div>

        {isBuffering && !isError && !paused && (
          <div className="afp-overlay afp-overlay-clear">
            <div className="afp-spinner" />
          </div>
        )}

        {isError && (
          <div className="afp-overlay" onClick={event => event.stopPropagation()}>
            <SvgIcon d={ICONS.error} size={42} style={{ color: '#ff6b6b' }} />
            <div className="afp-error-title">Gagal memutar video</div>
            <div className="afp-error-text">{errorMessage}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="afp-option" onClick={retrySource}>
                Coba lagi
              </button>
              <button className="afp-option" onClick={() => setShowSettings(true)}>
                Pengaturan
              </button>
            </div>
          </div>
        )}

        <div
          className={`afp-bottom${controlsVisible ? '' : ' afp-hidden'}`}
          onClick={event => event.stopPropagation()}
          onDoubleClick={event => event.stopPropagation()}>
          <div
            className="afp-progress"
            ref={seekBarRef}
            data-seeking={isSeeking}
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerUp={handleSeekPointerUp}
            onPointerCancel={handleSeekPointerUp}
            onPointerLeave={() => {
              if (!seekingRef.current) setSeekPreview(null);
            }}>
            <div className="afp-track">
              <div className="afp-buffer" style={{ width: `${bufferedPercent}%` }} />
              <div className="afp-played" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="afp-thumb" style={{ left: `${progressPercent}%` }} />
            {seekPreview && (
              <div className="afp-progress-tip" style={{ left: seekPreview.x }}>
                {formatTime(seekPreview.time)}
              </div>
            )}
          </div>

          <div className="afp-row">
            <button
              className="afp-btn"
              title={paused ? 'Putar (Spasi)' : 'Jeda (Spasi)'}
              onClick={event => {
                event.stopPropagation();
                togglePlay();
              }}>
              <SvgIcon d={paused ? ICONS.play : ICONS.pause} />
            </button>
            <button
              className="afp-btn"
              title="Mundur 10 detik (←)"
              onClick={event => {
                event.stopPropagation();
                seekBy(-10);
              }}>
              <SvgIcon d={ICONS.replay} />
            </button>
            <button
              className="afp-btn"
              title="Maju 10 detik (→)"
              onClick={event => {
                event.stopPropagation();
                seekBy(10);
              }}>
              <SvgIcon d={ICONS.replay} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <div className="afp-time">
              <span>{formatTime(currentTime)}</span>
              <span className="dim"> / {formatTime(duration)}</span>
            </div>
            <div className="afp-spacer" />
            <div className="afp-volume">
              <button
                className="afp-btn"
                title={muted ? 'Nyalakan suara (M)' : 'Bisukan (M)'}
                onClick={event => {
                  event.stopPropagation();
                  toggleMute();
                }}>
                <SvgIcon d={muted || volume === 0 ? ICONS.mute : ICONS.volume} />
              </button>
              {!compact && (
                <input
                  className="afp-range afp-vol-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  title={`Volume ${Math.round((muted ? 0 : volume) * 100)}%`}
                  style={{ '--afp-fill': `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                  onChange={event => applyVolume(Number(event.target.value))}
                  onDoubleClick={event => event.stopPropagation()}
                />
              )}
            </div>
            <button
              className="afp-btn afp-btn-text"
              title="Kecepatan putar"
              onClick={event => {
                event.stopPropagation();
                cycleRate();
              }}>
              {playbackRate}×
            </button>
            {hasSubtitles && (
              <button
                className="afp-btn"
                title={subtitlesEnabled ? 'Nonaktifkan subtitle (C)' : 'Aktifkan subtitle (C)'}
                onClick={event => {
                  event.stopPropagation();
                  toggleSubtitles();
                }}>
                <SvgIcon
                  d={subtitlesEnabled ? ICONS.captions : ICONS.captionsOff}
                  style={subtitlesEnabled ? undefined : { opacity: 0.65 }}
                />
              </button>
            )}
            <button
              className="afp-btn"
              title="Pengaturan (S)"
              onClick={event => {
                event.stopPropagation();
                setShowSettings(value => !value);
              }}>
              <SvgIcon d={ICONS.settings} />
            </button>
            <button
              className="afp-btn"
              title="Picture-in-Picture (P)"
              onClick={event => {
                event.stopPropagation();
                void togglePip();
              }}>
              <SvgIcon d={ICONS.pip} />
            </button>
            <button
              className="afp-btn"
              title={fullscreen ? 'Keluar layar penuh (F)' : 'Layar penuh (F)'}
              onClick={event => {
                event.stopPropagation();
                toggleFullscreen();
              }}>
              <SvgIcon d={fullscreen ? ICONS.fullscreenExit : ICONS.fullscreen} />
            </button>
          </div>
        </div>

        {showSettings && !isError && (
          <div
            className="afp-settings"
            onClick={event => event.stopPropagation()}
            onDoubleClick={event => event.stopPropagation()}>
            <h4>Kecepatan putar</h4>
            <div className="afp-setting-group">
              {SPEEDS.map(rate => (
                <button
                  key={rate}
                  className={`afp-option${playbackRate === rate ? ' active' : ''}`}
                  onClick={() => applyRate(rate)}>
                  {rate}×
                </button>
              ))}
            </div>

            <h4>Rasio video</h4>
            <div className="afp-setting-group">
              <button
                className={`afp-option${contentFit === 'contain' ? ' active' : ''}`}
                onClick={() => applyFit('contain')}>
                Fit
              </button>
              <button
                className={`afp-option${contentFit === 'cover' ? ' active' : ''}`}
                onClick={() => applyFit('cover')}>
                Isi
              </button>
              <button
                className={`afp-option${contentFit === 'fill' ? ' active' : ''}`}
                onClick={() => applyFit('fill')}>
                Regang
              </button>
            </div>

            {levels.length > 0 && (
              <>
                <h4>Kualitas stream</h4>
                <div className="afp-setting-group">
                  <button
                    className={`afp-option${activeLevel === -1 ? ' active' : ''}`}
                    onClick={() => setQuality(-1)}>
                    Otomatis
                  </button>
                  {levels.map(level => (
                    <button
                      key={level.index}
                      className={`afp-option${activeLevel === level.index ? ' active' : ''}`}
                      onClick={() => setQuality(level.index)}>
                      {level.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="afp-setting-row">
              <span>Subtitle</span>
              <button
                className={`afp-switch${subtitlesEnabled && hasSubtitles ? ' active' : ''}`}
                title="Aktif/nonaktifkan subtitle"
                onClick={() => {
                  if (!hasSubtitles) {
                    flashMessage('Subtitle tidak tersedia');
                    return;
                  }
                  toggleSubtitles();
                }}
              />
            </div>

            {subtitleError && (
              <div className="afp-setting-row" style={{ color: '#ffb4ab', fontSize: 12 }}>
                <span>Subtitle gagal dimuat</span>
                <button className="afp-option" onClick={() => setSubtitleRetry(value => value + 1)}>
                  Ulangi
                </button>
              </div>
            )}

            <div className="afp-setting-row">
              <span>Ulangi video</span>
              <button
                className={`afp-switch${loop ? ' active' : ''}`}
                title="Aktif/nonaktifkan pengulangan"
                onClick={() =>
                  setLoop(value => {
                    writeSetting(STORAGE_KEYS.loop, !value);
                    return !value;
                  })
                }
              />
            </div>

            <div
              className="afp-setting-row"
              style={{ display: 'block', color: '#9e9e9e', fontSize: 11, lineHeight: 1.6 }}>
              Spasi: putar/jeda · ←/→: 5 detik · ↑/↓: volume
              <br />
              F: layar penuh · C: subtitle · P: Picture-in-Picture · S: pengaturan
            </div>
          </div>
        )}

        {flash && <div className="afp-flash">{flash}</div>}
      </div>
    </View>
  );
}

export default memo(VideoPlayer);
