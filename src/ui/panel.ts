import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { GuildPlayer } from '../music/GuildPlayer.js';
import type { Track } from '../music/Track.js';

/** Stable custom ids for the control buttons; shared by the builder and the interaction router. */
export const MusicButtonId = {
  Back: 'music:back',
  PlayPause: 'music:playpause',
  Skip: 'music:skip',
  Stop: 'music:stop',
  Queue: 'music:queue',
} as const;

const QUEUE_PREVIEW_LIMIT = 10;

function formatDuration(durationMs: number): string {
  if (durationMs <= 0) {
    return 'Live';
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number): string => value.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
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

export function buildPanelComponents(isPaused = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
  return [row];
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
