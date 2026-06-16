import { Client, Collection, GatewayIntentBits } from 'discord.js';
import type { Command } from '../types/Command.js';
import type { Event } from '../types/Event.js';

/**
 * The bot client. Only the intents a music bot needs are requested: guild metadata and voice
 * state (to join channels and detect when a voice channel empties). No privileged intents.
 */
export class DaemonClient extends Client {
  public readonly commands = new Collection<string, Command>();

  public constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });
  }

  public registerEvents(events: readonly Event[]): this {
    for (const event of events) {
      // The listener is cast at this framework boundary: a generic loader cannot satisfy the
      // per-event tuple union that `Client.on`/`once` expect, but each `Event.execute` is itself
      // strongly typed against its own `name`, so the registration stays sound.
      const listener = (...args: unknown[]): unknown =>
        (event.execute as (...handlerArgs: unknown[]) => unknown)(...args);
      if (event.once) {
        this.once(event.name as never, listener as never);
      } else {
        this.on(event.name as never, listener as never);
      }
    }
    return this;
  }

  public registerCommands(commands: readonly Command[]): this {
    for (const command of commands) {
      this.commands.set(command.data.name, command);
    }
    return this;
  }
}
