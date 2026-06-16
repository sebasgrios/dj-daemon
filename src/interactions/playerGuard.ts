import { type ButtonInteraction, type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { GuildPlayer } from '../music/GuildPlayer.js';
import { musicManager } from '../music/GuildMusicManager.js';

/**
 * Resolves the guild's player for a control interaction (slash command or panel button), enforcing
 * that it runs in a guild, that something is playing, and that the caller is in the bot's voice
 * channel. On any failure it replies ephemerally and returns null.
 */
export async function resolveControllablePlayer(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
): Promise<GuildPlayer | null> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      content: 'This can only be used in a server.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const player = musicManager.get(interaction.guildId);
  if (!player) {
    await interaction.reply({
      content: 'Nothing is playing right now.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  if (interaction.member.voice.channelId !== player.voiceChannelId) {
    await interaction.reply({
      content: 'You must be in my voice channel to control playback.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  return player;
}
