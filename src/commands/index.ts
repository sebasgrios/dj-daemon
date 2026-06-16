import type { Command } from '../types/Command.js';
import { clearCommand } from './clear.js';
import { loopCommand } from './loop.js';
import { nowPlayingCommand } from './nowplaying.js';
import { pauseCommand } from './pause.js';
import { playCommand } from './play.js';
import { queueCommand } from './queue.js';
import { removeCommand } from './remove.js';
import { rewindCommand } from './rewind.js';
import { shuffleCommand } from './shuffle.js';
import { nextCommand, skipCommand } from './skip.js';
import { stopCommand } from './stop.js';
import { volumeCommand } from './volume.js';

/** The registry of every slash command the bot exposes. */
export const commands: readonly Command[] = [
  playCommand,
  rewindCommand,
  skipCommand,
  nextCommand,
  pauseCommand,
  nowPlayingCommand,
  queueCommand,
  loopCommand,
  volumeCommand,
  shuffleCommand,
  clearCommand,
  removeCommand,
  stopCommand,
];
