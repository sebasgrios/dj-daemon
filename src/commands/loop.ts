import { SlashCommandBuilder } from 'discord.js';
import { resolveControllablePlayer } from '../interactions/playerGuard.js';
import type { LoopMode } from '../music/GuildPlayer.js';
import type { Command } from '../types/Command.js';

const LABELS: Record<LoopMode, string> = {
  off: 'Off',
  track: '🔂 Track',
  queue: '🔁 Queue',
};

export const loopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the loop mode (cycles off → track → queue if no mode is given).')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .addChoices(
          { name: 'off', value: 'off' },
          { name: 'track', value: 'track' },
          { name: 'queue', value: 'queue' },
        ),
    ),
  async execute(interaction) {
    const player = await resolveControllablePlayer(interaction);
    if (!player) {
      return;
    }
    const requested = interaction.options.getString('mode') as LoopMode | null;
    let mode: LoopMode;
    if (requested) {
      player.setLoop(requested);
      mode = requested;
    } else {
      mode = player.cycleLoop();
    }
    await interaction.reply({ content: `🔁 Loop: **${LABELS[mode]}**` });
  },
};
