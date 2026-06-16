import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';

/**
 * Removes all registered slash commands. Clears the global set (which shows in every guild) and,
 * when DISCORD_GUILD_ID is set, that guild's set too. Useful to wipe stale commands left over from
 * a previous version before re-registering with deploy-commands.
 */
const rest = new REST().setToken(env.discord.token);

await rest.put(Routes.applicationCommands(env.discord.clientId), { body: [] });
console.log('Cleared global commands.');

if (env.discord.guildId) {
  await rest.put(Routes.applicationGuildCommands(env.discord.clientId, env.discord.guildId), {
    body: [],
  });
  console.log(`Cleared commands for guild ${env.discord.guildId}.`);
}
