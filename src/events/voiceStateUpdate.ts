import { Events } from 'discord.js';
import { musicManager } from '../music/GuildMusicManager.js';
import type { Event } from '../types/Event.js';

/** Leaves the voice channel (and clears the queue) once the last human member leaves. */
export const voiceStateUpdateEvent: Event<Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  execute(oldState) {
    const player = musicManager.get(oldState.guild.id);
    if (!player || !player.voiceChannelId) {
      return;
    }

    const channel = oldState.guild.channels.cache.get(player.voiceChannelId);
    if (!channel?.isVoiceBased()) {
      return;
    }

    const humanCount = channel.members.filter((member) => !member.user.bot).size;
    if (humanCount === 0) {
      player.stop();
    }
  },
};
