import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { Command } from '../types/Command.js';

async function skipToNext(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = await resolveControllablePlayer(interaction);
  if (!player) {
    return;
  }
  player.skip();
  await interaction.reply({ content: '⏭️ Skipped to the next track.' });
}

export const skipCommand: Command = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip to the next track.'),
  execute: skipToNext,
};

/** Alias of /skip. */
export const nextCommand: Command = {
  data: new SlashCommandBuilder().setName('next').setDescription('Play the next track in the queue.'),
  execute: skipToNext,
};
