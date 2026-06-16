import { SlashCommandBuilder } from 'discord.js';
import { resolveActivePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';
import { buildNowPlayingStatusEmbed } from '../ui/panel.js';

export const nowPlayingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the current track with its progress.'),
  async execute(interaction) {
    const player = await resolveActivePlayer(interaction);
    if (!player) {
      return;
    }
    await interaction.reply({ embeds: [buildNowPlayingStatusEmbed(player)] });
  },
};
