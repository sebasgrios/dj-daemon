import type { Readable } from 'node:stream';
import { youtubeDl } from 'youtube-dl-exec';
import type { RequestedBy, Track } from '../music/Track.js';

/** Minimal shape of the yt-dlp JSON we rely on (a single video, search hit, or playlist entry). */
interface YouTubeEntry {
  id?: string;
  title?: string;
  duration?: number | null;
  thumbnail?: string | null;
  webpage_url?: string;
  url?: string;
  uploader?: string | null;
  channel?: string | null;
}

interface YouTubePlaylist {
  title?: string;
  entries?: (YouTubeEntry | null)[];
}

/** YouTube thumbnails are derivable from the video id, so playlist entries never lack one. */
function thumbnailFor(id: string | undefined, explicit?: string | null): string | null {
  if (explicit) {
    return explicit;
  }
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function watchUrl(entry: YouTubeEntry): string {
  if (entry.id) {
    return `https://www.youtube.com/watch?v=${entry.id}`;
  }
  return entry.webpage_url ?? entry.url ?? '';
}

function buildTrack(entry: YouTubeEntry, requestedBy: RequestedBy): Track {
  const target = watchUrl(entry);
  return {
    title: entry.title ?? 'Unknown title',
    author: entry.uploader ?? entry.channel ?? null,
    durationMs: Math.round((entry.duration ?? 0) * 1000),
    thumbnail: thumbnailFor(entry.id, entry.thumbnail),
    url: entry.webpage_url ?? target,
    source: 'youtube',
    requestedBy,
    stream: () => createYouTubeStream(target),
  };
}

/** Spawns yt-dlp to pipe the best audio-only stream to stdout. Fresh process on every call. */
export async function createYouTubeStream(url: string): Promise<Readable> {
  const subprocess = youtubeDl.exec(
    url,
    {
      output: '-',
      format: 'bestaudio[ext=webm]/bestaudio/best',
      quiet: true,
      noWarnings: true,
      noPlaylist: true,
    },
    { stdio: ['ignore', 'pipe', 'ignore'] },
  );
  // The process is killed when playback ends/skips, which rejects this promise — ignore it.
  subprocess.catch(() => undefined);

  const stream = subprocess.stdout;
  if (!stream) {
    throw new Error('yt-dlp did not produce an audio stream.');
  }
  return stream;
}

/** Resolves any yt-dlp-supported URL (single item or playlist) into tracks. */
export async function resolveUrl(url: string, requestedBy: RequestedBy): Promise<Track[]> {
  const isPlaylist = /[?&]list=/.test(url);

  if (isPlaylist) {
    const data = (await youtubeDl(url, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true,
    })) as unknown as YouTubePlaylist;
    return (data.entries ?? [])
      .filter((entry): entry is YouTubeEntry => Boolean(entry?.id ?? entry?.url))
      .map((entry) => buildTrack(entry, requestedBy));
  }

  const data = (await youtubeDl(url, {
    dumpSingleJson: true,
    noPlaylist: true,
    noWarnings: true,
  })) as unknown as YouTubeEntry;
  return [buildTrack(data, requestedBy)];
}

/** Searches YouTube and returns the top hit as a track, or null when there are no results. */
export async function searchYouTube(query: string, requestedBy: RequestedBy): Promise<Track | null> {
  const data = (await youtubeDl(`ytsearch1:${query}`, {
    dumpSingleJson: true,
    noWarnings: true,
  })) as unknown as YouTubePlaylist;

  const entry = data.entries?.find((candidate): candidate is YouTubeEntry => Boolean(candidate?.id));
  return entry ? buildTrack(entry, requestedBy) : null;
}
