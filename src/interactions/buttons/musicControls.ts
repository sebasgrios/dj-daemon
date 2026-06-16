import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { musicManager } from '../../music/GuildMusicManager.js';
import { MusicButtonId, buildPanelComponents, buildQueueEmbed } from '../../ui/panel.js';

export function isMusicButton(customId: string): boolean {
  return customId.startsWith('music:');
}

export async function handleMusicButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inCachedGuild()) {
    return;
  }

  const player = musicManager.get(interaction.guildId);
  if (!player) {
    await interaction.reply({
      content: 'Nothing is playing right now.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Only members in the bot's voice channel may control playback.
  if (interaction.member.voice.channelId !== player.voiceChannelId) {
    await interaction.reply({
      content: 'You must be in my voice channel to control playback.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  switch (interaction.customId) {
    case MusicButtonId.Back:
      await player.back();
      await interaction.deferUpdate();
      return;

    case MusicButtonId.Skip:
      player.skip();
      await interaction.deferUpdate();
      return;

    case MusicButtonId.PlayPause:
      if (player.isPaused) {
        player.resume();
      } else {
        player.pause();
      }
      // Reflect the new state on the panel that was clicked.
      await interaction.update({ components: buildPanelComponents(player.isPaused) });
      return;

    case MusicButtonId.Stop:
      player.stop();
      await interaction.reply({ content: '⏹️ Stopped the queue and left the channel.' });
      return;

    case MusicButtonId.Queue:
      await interaction.reply({
        embeds: [buildQueueEmbed(player)],
        flags: MessageFlags.Ephemeral,
      });
      return;

    default:
      await interaction.deferUpdate();
  }
}
