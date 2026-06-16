import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const pauseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause playback, or resume it if already paused.'),
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
