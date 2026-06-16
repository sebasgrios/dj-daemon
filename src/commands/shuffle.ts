import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const shuffleCommand: Command = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue.'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    if (player.queue.isEmpty) {
      await interaction.reply({ content: 'The queue is empty.', flags: MessageFlags.Ephemeral });
      return;
    }
    player.queue.shuffle();
    await interaction.reply({ content: `🔀 Shuffled **${player.queue.size}** tracks.` });
  },
};
