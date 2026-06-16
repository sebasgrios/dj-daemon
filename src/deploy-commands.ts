import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { env } from './config/env.js';

/**
 * Registers the slash commands with Discord. If DISCORD_GUILD_ID is set the commands are
 * registered to that single guild (applies instantly — use while developing); otherwise they
 * are registered globally (can take up to an hour to propagate).
 */
const body = commands.map((command) => command.data.toJSON());
const rest = new REST().setToken(env.discord.token);

const route = env.discord.guildId
  ? Routes.applicationGuildCommands(env.discord.clientId, env.discord.guildId)
  : Routes.applicationCommands(env.discord.clientId);

const registered = (await rest.put(route, { body })) as unknown[];
console.log(
  `Registered ${registered.length} command(s) ${
    env.discord.guildId ? `to guild ${env.discord.guildId}` : 'globally'
  }.`,
);
