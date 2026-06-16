import { DaemonClient } from './client/DaemonClient.js';
import { commands } from './commands/index.js';
import { env } from './config/env.js';
import { interactionCreateEvent } from './events/interactionCreate.js';
import { readyEvent } from './events/ready.js';

const client = new DaemonClient();

client.registerCommands(commands);
client.registerEvents([readyEvent, interactionCreateEvent]);

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

await client.login(env.discord.token);
