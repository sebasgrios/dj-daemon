import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const clearCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the queue without leaving the channel.'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    const count = player.queue.size;
    player.queue.clear();
    await interaction.reply({
      content: count > 0 ? `🗑️ Cleared **${count}** tracks from the queue.` : 'The queue is already empty.',
    });
  },
};
