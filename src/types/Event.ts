import type { ClientEvents } from 'discord.js';

/** A typed gateway event handler. `name` is a `discord.js` event key; `execute` receives its args. */
export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  readonly name: K;
  readonly once?: boolean;
  execute(...args: ClientEvents[K]): unknown;
}
