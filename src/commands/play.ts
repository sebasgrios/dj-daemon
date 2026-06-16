import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/Command.js';

export const playCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a track or add it to the queue (YouTube/Spotify URL or search text).')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('A YouTube/Spotify URL, or text to search on YouTube')
        .setRequired(true),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({
        content: 'You must be in a voice channel to play music.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const query = interaction.options.getString('query', true);

    await interaction.deferReply();
    // The playback engine (resolution + queue + voice connection) is wired in the next milestone.
    await interaction.editReply(`🔎 Received request: \`${query}\``);
  },
};
