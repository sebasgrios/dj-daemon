import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

export const removeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue by its position.')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Queue position (see /queue)')
        .setMinValue(1)
        .setRequired(true),
    ),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    const position = interaction.options.getInteger('position', true);
    const removed = player.queue.removeAt(position - 1);
    await interaction.reply(
      removed
        ? { content: `🗑️ Removed **${removed.title}** from the queue.` }
        : { content: `There is no track at position ${position}.`, flags: MessageFlags.Ephemeral },
    );
  },
};
