import type { SendableChannels } from 'discord.js';
import type { PlayerNotifier } from '../music/GuildPlayer.js';
import { buildNowPlayingEmbed, buildPanelComponents } from './panel.js';

/** A notifier that posts a fresh now-playing panel to a text channel on every track start. */
export function createPanelNotifier(channel: SendableChannels): PlayerNotifier {
  return {
    async onTrackStart(track) {
      try {
        await channel.send({
          embeds: [buildNowPlayingEmbed(track)],
          components: buildPanelComponents(),
        });
      } catch (error) {
        console.error('[panel] failed to post now-playing message', error);
      }
    },
  };
}

/** Used when the invoking channel cannot receive messages; playback proceeds without a panel. */
export const silentNotifier: PlayerNotifier = {
  onTrackStart() {
    // no-op
  },
};
