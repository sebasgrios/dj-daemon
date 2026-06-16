import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';
import { buildQueueEmbed } from '../ui/panel.js';

export const queueCommand: Command = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current queue.'),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    await interaction.reply({
      embeds: [buildQueueEmbed(player)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
