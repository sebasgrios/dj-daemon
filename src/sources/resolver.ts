import type { RequestedBy, Track } from '../music/Track.js';
import { isSpotifyConfigured, isSpotifyUrl, resolveSpotify } from './spotify.js';
import { resolveUrl, searchYouTube } from './youtube.js';

/** Raised for problems that should be shown to the user verbatim. */
export class ResolveError extends Error {}

export interface ResolveResult {
  readonly tracks: readonly Track[];
}

function looksLikeUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

/**
 * Turns a /play query into tracks: Spotify links go through the Spotify API, any other URL is
 * handled by yt-dlp (broad site support), and plain text becomes a YouTube search.
 */
export async function resolveQuery(query: string, requestedBy: RequestedBy): Promise<ResolveResult> {
  const input = query.trim();
  if (!input) {
    return { tracks: [] };
  }

  if (isSpotifyUrl(input)) {
    if (!isSpotifyConfigured()) {
      throw new ResolveError('Spotify links are not supported right now (missing API credentials).');
    }
    return { tracks: await resolveSpotify(input, requestedBy) };
  }

  if (looksLikeUrl(input)) {
    return { tracks: await resolveUrl(input, requestedBy) };
  }

  const match = await searchYouTube(input, requestedBy);
  return { tracks: match ? [match] : [] };
}
