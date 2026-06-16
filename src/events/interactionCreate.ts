import { type ButtonInteraction, type ChatInputCommandInteraction, Events, MessageFlags } from 'discord.js';
import type { DaemonClient } from '../client/DaemonClient.js';
import { handleMusicButton, isMusicButton } from '../interactions/buttons/musicControls.js';
import type { Event } from '../types/Event.js';

export const interactionCreateEvent: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    }
  },
};

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  if (!isMusicButton(interaction.customId)) {
    return;
  }
  try {
    await handleMusicButton(interaction);
  } catch (error) {
    console.error(`[button:${interaction.customId}]`, error);
  }
}

async function handleChatInputCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const client = interaction.client as DaemonClient;
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[command:${interaction.commandName}]`, error);
    const payload = {
      content: 'Something went wrong while running this command.',
      flags: MessageFlags.Ephemeral,
    } as const;
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
}
