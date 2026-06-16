import type { Command } from '../types/Command.js';
import { pauseCommand } from './pause.js';
import { playCommand } from './play.js';
import { queueCommand } from './queue.js';
import { rewindCommand } from './rewind.js';
import { nextCommand, skipCommand } from './skip.js';
import { stopCommand } from './stop.js';

/** The registry of every slash command the bot exposes. */
export const commands: readonly Command[] = [
  playCommand,
  rewindCommand,
  skipCommand,
  nextCommand,
  pauseCommand,
  queueCommand,
  stopCommand,
];
