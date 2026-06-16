import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const rewindCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('rewind')
    .setDescription('Restart the current track (or go to the previous one if it just started).'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    const result = await player.back();
    await interaction.reply({
      content: result === 'previous' ? '⏮️ Playing the previous track.' : '⏮️ Restarted the track.',
    });
  },
};
