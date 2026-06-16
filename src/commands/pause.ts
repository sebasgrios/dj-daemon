import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const pauseCommand: Command = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause playback.'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    if (player.isPaused) {
      await interaction.reply({ content: '⏸️ Already paused.', flags: MessageFlags.Ephemeral });
      return;
    }
    player.pause();
    await interaction.reply({ content: '⏸️ Paused.' });
  },
};
