import {
  type AudioPlayer,
  AudioPlayerStatus,
  type AudioResource,
  type VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  entersState,
} from '@discordjs/voice';
import { Queue } from './Queue.js';
import type { Track } from './Track.js';

/** Loop modes: no looping, repeat the current track, or cycle the whole queue. */
export type LoopMode = 'off' | 'track' | 'queue';

/** A snapshot of playback state passed to the notifier so the panel renders accurate controls. */
export interface PlaybackState {
  loop: LoopMode;
  isPaused: boolean;
}

/** Receives playback lifecycle notifications. Implemented by the UI layer to post the panel. */
export interface PlayerNotifier {
  onTrackStart(track: Track, state: PlaybackState): void | Promise<void>;
}

/** Outcome of the "back" control: the current track was restarted, or the previous one resumed. */
export type BackResult = 'restarted' | 'previous';

/** Above this playback position the "back" control restarts the current track instead of going back. */
const BACK_RESTART_THRESHOLD_MS = 10_000;
/** Idle time with an empty queue before the bot leaves the voice channel. */
const IDLE_DISCONNECT_MS = 5 * 60_000;
const CONNECTION_READY_TIMEOUT_MS = 20_000;

/**
 * Drives playback for a single guild: owns the voice connection and audio player, the queue and
 * history, and the transitions between tracks. All control surfaces (slash command + panel
 * buttons) operate through this object.
 */
export class GuildPlayer {
  public readonly queue = new Queue();
  private current: Track | null = null;
  private resource: AudioResource<Track> | null = null;
  private readonly player: AudioPlayer = createAudioPlayer();
  private idleTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private loopMode: LoopMode = 'off';
  /** Playback volume as a 0..1 scale applied to each resource. */
  private volumeScale = 1;
  /** Set right before a manual skip so the idle handler bypasses track looping for that transition. */
  private skipping = false;

  public constructor(
    public readonly guildId: string,
    private readonly connection: VoiceConnection,
    private readonly notifier: PlayerNotifier,
    private readonly onDestroy: () => void,
  ) {
    this.connection.subscribe(this.player);
    this.player.on(AudioPlayerStatus.Idle, () => void this.handleIdle());
    this.player.on('error', (error) => console.error(`[player:${this.guildId}]`, error));
    this.connection.on(VoiceConnectionStatus.Disconnected, () => void this.handleDisconnect());
    this.connection.on('stateChange', (oldState, newState) => {
      console.log(`[voice:${this.guildId}] ${oldState.status} -> ${newState.status}`);
    });
    this.connection.on('error', (error) => console.error(`[voice:${this.guildId}]`, error));
  }

  public get nowPlaying(): Track | null {
    return this.current;
  }

  public get isPaused(): boolean {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  public get playbackPositionMs(): number {
    return this.resource?.playbackDuration ?? 0;
  }

  public get voiceChannelId(): string | null {
    return this.connection.joinConfig.channelId;
  }

  public get loop(): LoopMode {
    return this.loopMode;
  }

  /** Playback volume as a 0..100 percentage. */
  public get volume(): number {
    return Math.round(this.volumeScale * 100);
  }

  public setLoop(mode: LoopMode): void {
    this.loopMode = mode;
  }

  /** Cycles off -> track -> queue -> off and returns the new mode. */
  public cycleLoop(): LoopMode {
    this.loopMode = this.loopMode === 'off' ? 'track' : this.loopMode === 'track' ? 'queue' : 'off';
    return this.loopMode;
  }

  /** Sets volume from a 0..100 percentage, applying it immediately. Returns the clamped value. */
  public setVolume(percent: number): number {
    const clamped = Math.max(0, Math.min(percent, 100));
    this.volumeScale = clamped / 100;
    this.resource?.volume?.setVolume(this.volumeScale);
    return clamped;
  }

  /** Waits until the voice connection is ready, or throws on timeout. */
  public async waitUntilReady(): Promise<void> {
    await entersState(this.connection, VoiceConnectionStatus.Ready, CONNECTION_READY_TIMEOUT_MS);
  }

  /** Adds tracks to the queue and starts playback if nothing is currently playing. */
  public async enqueue(...tracks: Track[]): Promise<void> {
    this.queue.enqueue(...tracks);
    if (!this.current) {
      await this.advance();
    }
  }

  public pause(): boolean {
    return this.player.pause();
  }

  public resume(): boolean {
    return this.player.unpause();
  }

  /** Skips the current track; it is recorded in history by the idle handler. */
  public skip(): void {
    this.skipping = true;
    this.player.stop(true);
  }

  /**
   * "Back" control: if the current track has played past the threshold, restart it from the
   * beginning; otherwise jump to the previous track from history, re-queueing the current one so
   * it plays again right after. Returns what it did.
   */
  public async back(): Promise<BackResult> {
    if (!this.current) {
      return 'restarted';
    }
    if (this.playbackPositionMs > BACK_RESTART_THRESHOLD_MS) {
      await this.start(this.current);
      return 'restarted';
    }
    const previous = this.queue.takePrevious();
    if (!previous) {
      await this.start(this.current);
      return 'restarted';
    }
    this.queue.enqueueNext(this.current);
    await this.start(previous);
    return 'previous';
  }

  /** Stops everything: clears the queue and leaves the voice channel. */
  public stop(): void {
    this.destroy();
  }

  private async advance(): Promise<void> {
    const next = this.queue.next();
    if (!next) {
      this.current = null;
      this.resource = null;
      this.scheduleIdleDisconnect();
      return;
    }
    await this.start(next);
  }

  private async start(track: Track): Promise<void> {
    this.clearIdleTimer();
    try {
      const raw = await track.stream();
      const { stream, type } = await demuxProbe(raw);
      const resource = createAudioResource(stream, {
        inputType: type,
        inlineVolume: true,
        metadata: track,
      });
      resource.volume?.setVolume(this.volumeScale);
      this.current = track;
      this.resource = resource;
      this.player.play(resource);
      void this.notifier.onTrackStart(track, { loop: this.loopMode, isPaused: false });
    } catch (error) {
      console.error(`[player:${this.guildId}] failed to start "${track.title}"`, error);
      // Drop the broken track and try the next one.
      await this.advance();
    }
  }

  private async handleIdle(): Promise<void> {
    if (this.destroyed) {
      return;
    }
    const skipping = this.skipping;
    this.skipping = false;
    const finished = this.current;
    if (finished) {
      if (this.loopMode === 'track' && !skipping) {
        // Repeat the same track (skipping bypasses this for a single transition).
        await this.start(finished);
        return;
      }
      if (this.loopMode === 'queue') {
        this.queue.enqueue(finished);
      } else {
        this.queue.pushHistory(finished);
      }
    }
    await this.advance();
  }

  private async handleDisconnect(): Promise<void> {
    try {
      // Give the connection a moment to recover (e.g. the bot was moved between channels).
      await Promise.race([
        entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      this.destroy();
    }
  }

  private scheduleIdleDisconnect(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => this.destroy(), IDLE_DISCONNECT_MS);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.clearIdleTimer();
    this.queue.clear();
    this.queue.clearHistory();
    this.current = null;
    this.resource = null;
    this.player.stop(true);
    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      this.connection.destroy();
    }
    this.onDestroy();
  }
}
