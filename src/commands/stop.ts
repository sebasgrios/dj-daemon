import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const stopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback, clear the queue and leave the voice channel.'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    player.stop();
    await interaction.reply({ content: '⏹️ Stopped the queue and left the channel.' });
  },
};
