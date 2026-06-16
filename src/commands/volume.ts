import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const volumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume (0-100).')
    .addIntegerOption((option) =>
      option
        .setName('percent')
        .setDescription('Volume from 0 to 100')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true),
    ),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    const value = player.setVolume(interaction.options.getInteger('percent', true));
    await interaction.reply({ content: `🔊 Volume set to **${value}%**.` });
  },
};
