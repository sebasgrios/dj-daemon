import { env } from '../config/env.js';
import type { RequestedBy, Track } from '../music/Track.js';
import { searchYouTube } from './youtube.js';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

const SPOTIFY_URL_PATTERN =
  /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?|spotify:)(track|playlist|album)[/:]([a-zA-Z0-9]+)/;

interface SpotifyImage {
  url: string;
}
interface SpotifyArtist {
  name: string;
}
interface SpotifyTrackObject {
  name: string;
  duration_ms: number;
  external_urls: { spotify: string };
  artists: SpotifyArtist[];
  album?: { images: SpotifyImage[] };
}
interface SpotifyPlaylistPage {
  items: { track: SpotifyTrackObject | null }[];
  next: string | null;
}
interface SpotifyAlbumPage {
  items: SpotifyTrackObject[];
  next: string | null;
}
interface SpotifyAlbum {
  images: SpotifyImage[];
  tracks: SpotifyAlbumPage;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isSpotifyConfigured(): boolean {
  return Boolean(env.spotify.clientId && env.spotify.clientSecret);
}

export function isSpotifyUrl(input: string): boolean {
  return SPOTIFY_URL_PATTERN.test(input);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.value;
  }
  const credentials = Buffer.from(`${env.spotify.clientId}:${env.spotify.clientSecret}`).toString(
    'base64',
  );
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    throw new Error(`Spotify authentication failed (${response.status}).`);
  }
  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function spotifyGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Spotify API error (${response.status}) on ${path}.`);
  }
  return (await response.json()) as T;
}

/** Spotify cannot stream audio directly, so each track is played from its top YouTube match. */
function buildTrack(
  meta: { title: string; artists: string[]; durationMs: number; spotifyUrl: string; thumbnail: string | null },
  requestedBy: RequestedBy,
): Track {
  const searchQuery = `${meta.artists.join(' ')} ${meta.title}`.trim();
  return {
    title: meta.title,
    author: meta.artists.join(', ') || null,
    durationMs: meta.durationMs,
    thumbnail: meta.thumbnail,
    url: meta.spotifyUrl,
    source: 'spotify',
    requestedBy,
    stream: async () => {
      const match = await searchYouTube(searchQuery, requestedBy);
      if (!match) {
        throw new Error(`No playable source found for "${meta.title}".`);
      }
      return match.stream();
    },
  };
}

function toTrack(
  track: SpotifyTrackObject,
  thumbnail: string | null,
  requestedBy: RequestedBy,
): Track {
  return buildTrack(
    {
      title: track.name,
      artists: track.artists.map((artist) => artist.name),
      durationMs: track.duration_ms,
      spotifyUrl: track.external_urls.spotify,
      thumbnail: track.album?.images[0]?.url ?? thumbnail,
    },
    requestedBy,
  );
}

function relativePath(nextUrl: string): string {
  return nextUrl.replace(API_BASE, '');
}

async function resolvePlaylist(id: string, requestedBy: RequestedBy): Promise<Track[]> {
  const tracks: Track[] = [];
  let path: string | null = `/playlists/${id}/tracks?limit=100`;
  while (path) {
    const page: SpotifyPlaylistPage = await spotifyGet<SpotifyPlaylistPage>(path);
    for (const item of page.items) {
      if (item.track) {
        tracks.push(toTrack(item.track, null, requestedBy));
      }
    }
    path = page.next ? relativePath(page.next) : null;
  }
  return tracks;
}

async function resolveAlbum(id: string, requestedBy: RequestedBy): Promise<Track[]> {
  const album = await spotifyGet<SpotifyAlbum>(`/albums/${id}`);
  const cover = album.images[0]?.url ?? null;
  const tracks: Track[] = album.tracks.items.map((track) => toTrack(track, cover, requestedBy));

  let path: string | null = album.tracks.next ? relativePath(album.tracks.next) : null;
  while (path) {
    const page: SpotifyAlbumPage = await spotifyGet<SpotifyAlbumPage>(path);
    for (const track of page.items) {
      tracks.push(toTrack(track, cover, requestedBy));
    }
    path = page.next ? relativePath(page.next) : null;
  }
  return tracks;
}

/** Resolves a Spotify track/playlist/album URL into tracks with metadata; audio comes from YouTube. */
export async function resolveSpotify(input: string, requestedBy: RequestedBy): Promise<Track[]> {
  const match = SPOTIFY_URL_PATTERN.exec(input);
  if (!match) {
    return [];
  }
  const [, kind, id] = match;
  switch (kind) {
    case 'track': {
      const track = await spotifyGet<SpotifyTrackObject>(`/tracks/${id}`);
      return [toTrack(track, null, requestedBy)];
    }
    case 'playlist':
      return resolvePlaylist(id, requestedBy);
    case 'album':
      return resolveAlbum(id, requestedBy);
    default:
      return [];
  }
}
