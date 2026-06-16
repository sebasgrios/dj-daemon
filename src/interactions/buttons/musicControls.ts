import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { resolveControllablePlayer } from '../playerGuard.js';
import { MusicButtonId, buildPanelComponents, buildQueueEmbed } from '../../ui/panel.js';

export function isMusicButton(customId: string): boolean {
  return customId.startsWith('music:');
}

export async function handleMusicButton(interaction: ButtonInteraction): Promise<void> {
  const player = await resolveControllablePlayer(interaction);
  if (!player) {
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
      await interaction.update({
        components: buildPanelComponents({ isPaused: player.isPaused, loop: player.loop }),
      });
      return;

    case MusicButtonId.Shuffle:
      player.queue.shuffle();
      await interaction.reply({ content: '🔀 Shuffled the queue.', flags: MessageFlags.Ephemeral });
      return;

    case MusicButtonId.Loop: {
      const loop = player.cycleLoop();
      await interaction.update({
        components: buildPanelComponents({ isPaused: player.isPaused, loop }),
      });
      return;
    }

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
