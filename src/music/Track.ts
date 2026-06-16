import type { Readable } from 'node:stream';

export type TrackSource = 'youtube' | 'spotify';

export interface RequestedBy {
  readonly id: string;
  readonly displayName: string;
}

/**
 * A queued, playable track. Display metadata is plain data; `stream()` opens the audio bytes
 * lazily and can be called again to replay (used by the "back"/restart controls).
 */
export interface Track {
  readonly title: string;
  readonly author: string | null;
  /** Duration in milliseconds; 0 when unknown or for live streams. */
  readonly durationMs: number;
  readonly thumbnail: string | null;
  /** Original webpage URL, used for display and to re-create the audio stream. */
  readonly url: string;
  readonly source: TrackSource;
  readonly requestedBy: RequestedBy;
  /** Opens a fresh raw audio byte stream for this track. Re-callable (used for replay/back). */
  stream(): Promise<Readable>;
}
