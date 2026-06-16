import { DaemonClient } from './client/DaemonClient.js';
import { env } from './config/env.js';
import { readyEvent } from './events/ready.js';

const client = new DaemonClient();

client.registerEvents([readyEvent]);

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

await client.login(env.discord.token);
