import { ActivityType, Events } from 'discord.js';
import type { Event } from '../types/Event.js';

export const readyEvent: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.user.setPresence({
      activities: [{ name: '/play', type: ActivityType.Listening }],
      status: 'online',
    });
    console.log(
      `[ready] Logged in as ${client.user.tag} — serving ${client.guilds.cache.size} guild(s).`,
    );
  },
};
