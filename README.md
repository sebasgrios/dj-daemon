<div align="center">

<img src="https://github.com/sgonzari/Daemon/assets/45594459/b30b997a-0f29-4530-bef3-3ac98ae68532" width="440" alt="dj-daemon icon" />

# dj-daemon

**A fast, native Discord music bot — slash commands, an interactive panel, and broad source support.**

<p>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" height="26" alt="TypeScript" /></a>
  <a href="https://discord.js.org/"><img src="https://img.shields.io/badge/discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" height="26" alt="discord.js" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js_22+-339933?style=for-the-badge&logo=node.js&logoColor=white" height="26" alt="Node.js 22+" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" height="26" alt="Docker" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" height="26" alt="pnpm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" height="26" alt="MIT License" /></a>
</p>

</div>

---

Built with [discord.js](https://discord.js.org) and
[`@discordjs/voice`](https://github.com/discordjs/voice). It streams audio with
[yt-dlp](https://github.com/yt-dlp/yt-dlp) for broad site support, resolves Spotify metadata through
the official Web API, and is controlled with slash commands and an interactive panel.

## ✨ Features

- **`/play`** — play or queue a track from a YouTube/Spotify URL or plain-text search.
- **Playlists & albums** — YouTube playlists and Spotify playlists/albums are fully enqueued.
- **Control panel** — a now-playing embed (with the track thumbnail) and buttons:
  - ⏮️ **Back** — restart the current track if it has played past 10s, otherwise go to the previous track.
  - ⏸️/▶️ **Pause/Resume**.
  - ⏭️ **Skip**.
  - ⏹️ **Stop** — clear the queue and leave the voice channel.
  - 📜 **Queue** — view the queue.
- **Per-guild queue and history**, kept in memory.
- Controls are limited to members in the bot's voice channel; the bot leaves automatically when the
  channel empties.

## 🎛️ Commands

Every control is available both as a panel button and as a slash command:

| Command                     | Action                                                                   |
| --------------------------- | ------------------------------------------------------------------------ |
| `/play [query]`             | Play or queue a URL/search; with no query, resume playback.              |
| `/rewind`                   | Restart the current track, or go to the previous one if it just started. |
| `/skip`, `/next`            | Skip to the next track.                                                   |
| `/pause`                    | Pause playback.                                                           |
| `/resume`                   | Resume playback, or pause if already playing.                            |
| `/nowplaying`               | Show the current track with a progress bar, volume and loop state.       |
| `/queue`                    | Show the current queue.                                                   |
| `/loop [off\|track\|queue]` | Set the loop mode (cycles if no mode is given).                           |
| `/volume <0-100>`           | Set the playback volume.                                                  |
| `/shuffle`                  | Shuffle the queue.                                                        |
| `/clear`                    | Clear the queue without leaving.                                          |
| `/remove <position>`        | Remove a track from the queue by position.                               |
| `/stop`                     | Stop, clear the queue and leave the channel.                             |

The panel buttons mirror the transport controls plus 🔀 shuffle and 🔁 loop.

## 📋 Requirements

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose. That is the only host
  requirement — `ffmpeg`, `python3` and `yt-dlp` all live inside the image.
- A Discord application/bot token.
- *(Optional)* Spotify Web API credentials, required only for Spotify links.

## 🚀 Setup

1. Create a Discord application and bot at the
   [Developer Portal](https://discord.com/developers/applications); copy the **bot token** and the
   **application (client) ID**.
2. *(Optional)* Create a Spotify app at the
   [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) for the **Client ID** and
   **Client Secret**.
3. Copy the environment template and fill it in:

   ```bash
   cp .env.dist .env
   ```

   | Variable                | Required | Description                                                |
   | ----------------------- | :------: | ---------------------------------------------------------- |
   | `DISCORD_TOKEN`         |    ✅    | Bot token.                                                  |
   | `DISCORD_CLIENT_ID`     |    ✅    | Application (client) ID.                                    |
   | `DISCORD_GUILD_ID`      |    —     | Register commands instantly to one guild while developing. |
   | `SPOTIFY_CLIENT_ID`     |    —     | Spotify app client ID (needed for Spotify links).          |
   | `SPOTIFY_CLIENT_SECRET` |    —     | Spotify app client secret.                                 |

4. Invite the bot with the `bot` and `applications.commands` scopes and the **Connect** and
   **Speak** voice permissions.

## 🐳 Running with Docker

```bash
pnpm docker:deploy  # register slash commands (once, and whenever a command changes)
pnpm docker:up      # build and start the bot
pnpm docker:logs    # follow the logs
pnpm docker:down    # stop and remove the container
```

With `DISCORD_GUILD_ID` set, command registration is instant; otherwise global registration can take
up to an hour. Without the `COMPOSE_FILE` shortcut (below), pass the files explicitly, e.g.
`docker compose -f docker-compose.yml -f docker-compose.host.yml up --build`.

### The `COMPOSE_FILE` shortcut

The `pnpm docker:*` scripts call `docker compose` directly. On **Docker Desktop (macOS/Windows)**
Discord's voice UDP needs the host network, so point Compose at both files via your shell (enable
"host networking" in Docker Desktop settings first):

```bash
# add to ~/.zshrc / ~/.bashrc
export COMPOSE_FILE=docker-compose.yml:docker-compose.host.yml
```

On **Linux** leave `COMPOSE_FILE` unset (the default `docker-compose.yml` works on its own). For the
hot-reload dev overlay, use `docker-compose.yml:docker-compose.dev.yml` instead.

## 💻 Running natively (alternative for local dev)

You can also run without Docker. Requires Node 22+ and pnpm; install the media tools with Homebrew
(the `yt-dlp` formula bundles its own Python, avoiding the system Python 3.9):

```bash
brew install ffmpeg yt-dlp
pnpm install
```

In `.env`, point `YT_DLP_PATH` at the Homebrew binary (it is ignored automatically inside the Linux
container, so the same `.env` works for both):

```bash
YT_DLP_PATH=/opt/homebrew/bin/yt-dlp   # `which yt-dlp` (Apple Silicon shown)
```

Then:

```bash
pnpm deploy-commands   # once
pnpm dev               # watch mode
```

## 📜 Scripts

All scripts run with `pnpm <script>`.

<details>
<summary><strong>🐳 Docker (the usual day-to-day)</strong></summary>

<br>

These wrap `docker compose` and rely on `COMPOSE_FILE` (see above) to select the right overlay.

- **`docker:up`** — Builds the image (when needed) and starts the bot in the foreground. This is the
  normal way to run it; stop with `Ctrl+C`. Use it after editing code or the `.env`.
- **`docker:logs`** — Follows the bot's logs (`-f`). Useful when the container runs in another
  terminal or detached, e.g. to watch the `[voice:…]` connection lines while testing.
- **`docker:down`** — Stops and removes the container started by `docker:up`.
- **`docker:deploy`** — Rebuilds and registers the slash commands with Discord from inside the
  container. Run it **once after setup and every time you add or change a command**, otherwise the
  new commands won't appear in Discord.
- **`docker:clear`** — Rebuilds and removes **all** registered slash commands (global + guild).
  Handy to wipe stale commands left over from an older version before re-deploying.

</details>

<details>
<summary><strong>💻 Native development (alternative, without Docker)</strong></summary>

<br>

- **`dev`** — Runs the bot directly with `tsx watch`, reloading on source changes. Fastest feedback
  loop while developing (needs the native prerequisites above).
- **`start`** — Runs the already-compiled bot (`node dist/index.js`); run `build` first.
- **`deploy-commands`** — Registers the slash commands with Discord, on the host (no container).
- **`clear-commands`** — Removes all registered slash commands, on the host.

</details>

<details>
<summary><strong>🔧 Build &amp; checks</strong></summary>

<br>

- **`build`** — Compiles the TypeScript to `dist/` with `tsc`.
- **`typecheck`** — Type-checks the whole project without emitting files; run it (or rely on your
  editor) to catch type errors before committing.

</details>

## 📄 License

Released under the [MIT License](LICENSE).
