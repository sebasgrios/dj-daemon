import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { GuildPlayer, LoopMode } from '../music/GuildPlayer.js';
import type { Track } from '../music/Track.js';

/** Stable custom ids for the control buttons; shared by the builder and the interaction router. */
export const MusicButtonId = {
  Back: 'music:back',
  PlayPause: 'music:playpause',
  Skip: 'music:skip',
  Stop: 'music:stop',
  Queue: 'music:queue',
  Shuffle: 'music:shuffle',
  Loop: 'music:loop',
} as const;

/** Visual state used to render the panel buttons accurately. */
export interface PanelState {
  isPaused?: boolean;
  loop?: LoopMode;
}

const QUEUE_PREVIEW_LIMIT = 10;
const PROGRESS_BAR_SIZE = 18;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Always renders a clock (0:00, m:ss or h:mm:ss). */
function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function formatDuration(durationMs: number): string {
  return durationMs <= 0 ? 'Live' : formatClock(durationMs);
}

const LOOP_LABEL: Record<LoopMode, string> = {
  off: 'Off',
  track: '🔂 Track',
  queue: '🔁 Queue',
};

function progressBar(positionMs: number, durationMs: number): string {
  if (durationMs <= 0) {
    return `🔴 LIVE — \`${formatClock(positionMs)}\``;
  }
  const ratio = Math.max(0, Math.min(1, positionMs / durationMs));
  const index = Math.min(PROGRESS_BAR_SIZE - 1, Math.floor(ratio * PROGRESS_BAR_SIZE));
  const bar = `${'▬'.repeat(index)}🔘${'▬'.repeat(PROGRESS_BAR_SIZE - 1 - index)}`;
  return `${bar}\n\`${formatClock(positionMs)} / ${formatClock(durationMs)}\``;
}

/** The now-playing panel: an embed with the track thumbnail plus the control buttons. */
export function buildNowPlayingEmbed(track: Track): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Now playing' })
    .setTitle(track.title)
    .setURL(track.url || null)
    .addFields(
      { name: 'Duration', value: formatDuration(track.durationMs), inline: true },
      { name: 'Requested by', value: track.requestedBy.displayName, inline: true },
      { name: 'Source', value: track.source === 'spotify' ? 'Spotify' : 'YouTube', inline: true },
    );
  if (track.author) {
    embed.setDescription(track.author);
  }
  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }
  return embed;
}

export function buildPanelComponents(state: PanelState = {}): ActionRowBuilder<ButtonBuilder>[] {
  const { isPaused = false, loop = 'off' } = state;

  const transport = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MusicButtonId.Back)
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MusicButtonId.PlayPause)
      .setEmoji(isPaused ? '▶️' : '⏸️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(MusicButtonId.Skip)
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MusicButtonId.Stop)
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(MusicButtonId.Queue)
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
  );

  const modes = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MusicButtonId.Shuffle)
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MusicButtonId.Loop)
      .setEmoji(loop === 'track' ? '🔂' : '🔁')
      .setStyle(loop === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success),
  );

  return [transport, modes];
}

/** Detailed "now playing" card with a progress bar, volume and loop state (for /nowplaying). */
export function buildNowPlayingStatusEmbed(player: GuildPlayer): EmbedBuilder {
  const track = player.nowPlaying;
  if (!track) {
    return new EmbedBuilder().setTitle('Nothing is playing.');
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: player.isPaused ? 'Paused' : 'Now playing' })
    .setTitle(track.title)
    .setURL(track.url || null)
    .addFields(
      { name: 'Progress', value: progressBar(player.playbackPositionMs, track.durationMs) },
      { name: 'Volume', value: `${player.volume}%`, inline: true },
      { name: 'Loop', value: LOOP_LABEL[player.loop], inline: true },
      { name: 'In queue', value: String(player.queue.size), inline: true },
    );
  if (track.author) {
    embed.setDescription(track.author);
  }
  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }
  return embed;
}

/** Ephemeral embed shown when the "view queue" button is pressed. */
export function buildQueueEmbed(player: GuildPlayer): EmbedBuilder {
  const current = player.nowPlaying;
  const upcoming = player.queue.upcomingTracks();
  const lines: string[] = [];

  if (current) {
    lines.push(`**Now playing:** ${current.title}`);
    lines.push('');
  }

  if (upcoming.length === 0) {
    lines.push('The queue is empty.');
  } else {
    upcoming.slice(0, QUEUE_PREVIEW_LIMIT).forEach((track, index) => {
      lines.push(`\`${index + 1}.\` ${track.title}`);
    });
    if (upcoming.length > QUEUE_PREVIEW_LIMIT) {
      lines.push(`…and ${upcoming.length - QUEUE_PREVIEW_LIMIT} more.`);
    }
  }

  return new EmbedBuilder().setTitle('Queue').setDescription(lines.join('\n'));
}
