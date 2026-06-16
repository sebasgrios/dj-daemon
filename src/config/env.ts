import { config } from 'dotenv';

config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : undefined;
}

/** Validated, typed access to the process environment. */
export const env = {
  discord: {
    token: required('DISCORD_TOKEN'),
    clientId: required('DISCORD_CLIENT_ID'),
    /** When set, slash commands are registered to this guild only (instant) instead of globally. */
    guildId: optional('DISCORD_GUILD_ID'),
  },
  spotify: {
    clientId: optional('SPOTIFY_CLIENT_ID'),
    clientSecret: optional('SPOTIFY_CLIENT_SECRET'),
  },
  /** Optional path to a yt-dlp binary; falls back to the one bundled by youtube-dl-exec. */
  ytDlpPath: optional('YT_DLP_PATH'),
} as const;
