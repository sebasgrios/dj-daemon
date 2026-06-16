import { joinVoiceChannel } from '@discordjs/voice';
import type { VoiceBasedChannel } from 'discord.js';
import { GuildPlayer, type PlayerNotifier } from './GuildPlayer.js';

/** Owns one {@link GuildPlayer} per guild. Process-wide; all state lives in memory. */
export class GuildMusicManager {
  private readonly players = new Map<string, GuildPlayer>();

  public get(guildId: string): GuildPlayer | undefined {
    return this.players.get(guildId);
  }

  /** Returns the guild's player, joining the given voice channel and creating it if needed. */
  public async getOrCreate(
    channel: VoiceBasedChannel,
    notifier: PlayerNotifier,
  ): Promise<GuildPlayer> {
    const existing = this.players.get(channel.guild.id);
    if (existing) {
      return existing;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    const player = new GuildPlayer(channel.guild.id, connection, notifier, () =>
      this.players.delete(channel.guild.id),
    );
    this.players.set(channel.guild.id, player);

    try {
      await player.waitUntilReady();
    } catch (error) {
      player.destroy();
      throw error;
    }
    return player;
  }

  public destroy(guildId: string): void {
    this.players.get(guildId)?.destroy();
  }
}

export const musicManager = new GuildMusicManager();
