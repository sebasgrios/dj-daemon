import type { Track } from './Track.js';

/**
 * Per-guild track list: an `upcoming` FIFO plus a `past` history stack that powers the
 * "previous track" control. Entirely in-memory.
 */
export class Queue {
  private upcoming: Track[] = [];
  private past: Track[] = [];

  public get size(): number {
    return this.upcoming.length;
  }

  public get isEmpty(): boolean {
    return this.upcoming.length === 0;
  }

  public enqueue(...tracks: Track[]): void {
    this.upcoming.push(...tracks);
  }

  /** Puts a track at the front of the queue (next to play). */
  public enqueueNext(track: Track): void {
    this.upcoming.unshift(track);
  }

  public next(): Track | undefined {
    return this.upcoming.shift();
  }

  public pushHistory(track: Track): void {
    this.past.push(track);
  }

  public takePrevious(): Track | undefined {
    return this.past.pop();
  }

  public clear(): void {
    this.upcoming = [];
  }

  public clearHistory(): void {
    this.past = [];
  }

  /** Fisher-Yates shuffle of the upcoming tracks. */
  public shuffle(): void {
    for (let i = this.upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.upcoming[i], this.upcoming[j]] = [this.upcoming[j], this.upcoming[i]];
    }
  }

  /** Removes the upcoming track at a zero-based index, returning it (or undefined if out of range). */
  public removeAt(index: number): Track | undefined {
    if (index < 0 || index >= this.upcoming.length) {
      return undefined;
    }
    return this.upcoming.splice(index, 1)[0];
  }

  public upcomingTracks(): readonly Track[] {
    return [...this.upcoming];
  }
}
