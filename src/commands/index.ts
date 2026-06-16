import type { Command } from '../types/Command.js';
import { playCommand } from './play.js';

/** The registry of every slash command the bot exposes. */
export const commands: readonly Command[] = [playCommand];
