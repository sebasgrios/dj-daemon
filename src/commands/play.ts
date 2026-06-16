import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import { musicManager } from '../music/GuildMusicManager.js';
import { ResolveError, resolveQuery } from '../sources/resolver.js';
import type { Command } from '../types/Command.js';
import { createPanelNotifier, silentNotifier } from '../ui/panelNotifier.js';

export const playCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play or queue a track, or resume playback when used with no query.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('A YouTube/Spotify URL or search text. Leave empty to resume playback.')
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const query = interaction.options.getString('query');

    // No query: resume the paused track instead of playing a new one.
    if (!query) {
      const player = await resolveControllablePlayer(interaction);
      if (!player) {
        return;
      }
      if (player.isPaused) {
        player.resume();
        await interaction.reply({ content: '▶️ Resumed.' });
      } else {
        await interaction.reply({ content: 'Already playing.', flags: MessageFlags.Ephemeral });
      }
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

    await interaction.deferReply();

    const requestedBy = {
      id: interaction.user.id,
      displayName: interaction.member.displayName,
    };

    let tracks;
    try {
      ({ tracks } = await resolveQuery(query, requestedBy));
    } catch (error) {
      if (error instanceof ResolveError) {
        await interaction.editReply(error.message);
        return;
      }
      console.error('[play] failed to resolve query:', query, error);
      await interaction.editReply('Could not process that link or search.');
      return;
    }

    if (tracks.length === 0) {
      await interaction.editReply('No results found.');
      return;
    }

    const notifier = interaction.channel?.isSendable()
      ? createPanelNotifier(interaction.channel)
      : silentNotifier;

    let player;
    try {
      player = await musicManager.getOrCreate(voiceChannel, notifier);
    } catch {
      await interaction.editReply('I could not join your voice channel.');
      return;
    }

    await player.enqueue(...tracks);

    await interaction.editReply(
      tracks.length === 1
        ? `Added **${tracks[0].title}** to the queue.`
        : `Added **${tracks.length}** tracks to the queue.`,
    );
  },
};
