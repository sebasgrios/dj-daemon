# dj-daemon

A fast, native Discord music bot built with [discord.js](https://discord.js.org) and
[`@discordjs/voice`](https://github.com/discordjs/voice). It streams audio with
[yt-dlp](https://github.com/yt-dlp/yt-dlp) for broad site support, resolves Spotify metadata
through the official Web API, and is controlled with slash commands and an interactive panel.

## Features

- **`/play`** — play or queue a track from a YouTube/Spotify URL or plain-text search.
- **Playlists & albums** — YouTube playlists and Spotify playlists/albums are fully enqueued.
- **Control panel** — a now-playing embed (with the track thumbnail) and buttons:
  - ⏮️ Back — restart the current track if it has played past 10s, otherwise go to the previous track.
  - ⏸️/▶️ Pause/Resume.
  - ⏭️ Skip.
  - ⏹️ Stop — clear the queue and leave the voice channel.
  - 📜 Queue — view the queue.
- **Per-guild queue and history**, kept in memory.
- Controls are limited to members in the bot's voice channel; the bot leaves automatically when the
  channel empties.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose. That is the only host
  requirement — `ffmpeg`, `python3` and `yt-dlp` all live inside the image.
- A Discord application/bot token.
- (Optional) Spotify Web API credentials, required only for Spotify links.

## Setup

1. Create a Discord application and bot at the
   [Developer Portal](https://discord.com/developers/applications); copy the **bot token** and the
   **application (client) ID**.
2. (Optional) Create a Spotify app at the
   [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) for the **Client ID** and
   **Client Secret**.
3. Copy the environment template and fill it in:

   ```bash
   cp .env.dist .env
   ```

   | Variable                | Required | Description                                                       |
   | ----------------------- | -------- | ----------------------------------------------------------------- |
   | `DISCORD_TOKEN`         | yes      | Bot token.                                                        |
   | `DISCORD_CLIENT_ID`     | yes      | Application (client) ID.                                          |
   | `DISCORD_GUILD_ID`      | no       | Register commands instantly to one guild while developing.        |
   | `SPOTIFY_CLIENT_ID`     | no       | Spotify app client ID (needed for Spotify links).                 |
   | `SPOTIFY_CLIENT_SECRET` | no       | Spotify app client secret.                                        |

4. Invite the bot with the `bot` and `applications.commands` scopes and the **Connect** and
   **Speak** voice permissions.

## Registering slash commands

Run once (and whenever a command definition changes). With `DISCORD_GUILD_ID` set this is instant;
otherwise global registration can take up to an hour.

```bash
docker compose run --rm --build bot node dist/deploy-commands.js
```

## Running

On Linux the default bridge network is enough. On **Docker Desktop (macOS/Windows)** add the
host-network overlay so Discord's voice UDP traffic connects (enable "host networking" in Docker
Desktop settings first).

```bash
# Linux
docker compose up --build

# macOS / Windows (Docker Desktop): use the host network for voice
docker compose -f docker-compose.yml -f docker-compose.host.yml up --build

# Development with hot reload (tsx watch); combine with host.yml on macOS/Windows
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Running natively (alternative for local dev)

You can also run without Docker. Requires Node 22+ and pnpm; install the media tools with Homebrew
(the `yt-dlp` formula bundles its own Python, avoiding the system Python 3.9):

```bash
brew install ffmpeg yt-dlp
pnpm install
```

In `.env`, point `YT_DLP_PATH` at the Homebrew binary (it is ignored automatically inside the Linux
container, so the same `.env` works for both):

```
YT_DLP_PATH=/opt/homebrew/bin/yt-dlp   # `which yt-dlp` (Apple Silicon shown)
```

Then:

```bash
pnpm deploy-commands   # once
pnpm dev               # watch mode
```

| Script                 | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Run with hot reload (`tsx watch`).       |
| `pnpm build`           | Compile TypeScript to `dist/`.           |
| `pnpm start`           | Run the compiled bot.                    |
| `pnpm deploy-commands` | Register slash commands with Discord.    |
| `pnpm clear-commands`  | Remove all registered slash commands.    |
| `pnpm typecheck`       | Type-check without emitting.             |
