import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const resumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume playback, or pause it if it is already playing.'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    if (player.isPaused) {
      player.resume();
      await interaction.reply({ content: '▶️ Resumed.' });
    } else {
      player.pause();
      await interaction.reply({ content: '⏸️ Paused.' });
    }
  },
};
