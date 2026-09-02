# UnlimitedSongGuessle

UnlimitedSongGuessle is a mobile-friendly song guessing game built with Next.js. Each round plays progressively longer snippets of a song, and the player uses title/artist autocomplete to submit guesses.

## How It Works

1. The home page (`/`) links to the game at `/play`.
2. The play page creates or reuses a browser `clientId` and requests a random song from `/api/song/random/[clientId]`.
3. The API selects a row from the `songs_spotify` Postgres table, checks Upstash Redis for a recently used `(clientId, track_id)` pair, and fetches a 30-second preview URL from Deezer.
4. The selected track is marked inactive for that client for 48 hours, preventing immediate repeats.
5. The player hears snippets of 1, 2, 4, 7, 11, and 30 seconds. A correct guess wins the round; six wrong guesses or skips lose it.

The intended catalog workflow is `getSongsFromPlaylists()` in `lib/spotify_utils.ts`: Spotify playlist tracks become the source records, Deezer resolves each track and its preview, and the results are stored in Postgres. At the moment, `lib/db_script.ts` uses `songsArray` from `lib/songs_array.ts` as that workflow's source. This README treats that array as the current stand-in, rather than treating the commented playlist call as a missing feature.

## Tech Stack

- Next.js 16 App Router with React 19 and TypeScript
- Postgres, accessed through `pg` and `DATABASE_URL`
- Upstash Redis for per-client cooldowns
- Spotify Web API for the intended playlist import source
- Deezer API for track matching and preview URLs
- Tailwind CSS, Base UI, Lucide, and small local UI components

## Requirements

- Node.js and npm
- A Postgres database containing a `songs_spotify` table
- An Upstash Redis database with REST access
- A Spotify user token only when importing playlist data
- Network access to the Spotify and Deezer APIs for catalog ingestion and to Deezer at game runtime

## Environment Variables

Create `game/.env` (or `.env.local`) with:

```env
DATABASE_URL=postgres://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
SPOTIFY_USER_TOKEN=...
```

`SPOTIFY_USER_TOKEN` is not needed by the running game when the database is already populated. It is used by `getSongsFromPlaylists()` when rebuilding the catalog from Spotify playlists.

## Local Development

From the `game/` directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The available npm scripts are:

```bash
npm run dev    # Start the development server
npm run build  # Create a production build
npm start      # Serve the production build
npm run lint   # Run ESLint
```

## Catalog Ingestion

`lib/db_script.ts` imports each source record, normalizes its title and artist, resolves it through Deezer, and upserts it into Postgres using the Deezer track ID as the conflict key. Tracks without a Deezer match or preview are logged and skipped. The script also waits between requests to reduce rate limiting.

The script uses `getSongsFromPlaylists()` to build the songs catalogue from my personal Spotify playlists:

```ts
const songs: Song[] = getSongsFromPlaylists();
```

To run it, use a TypeScript runner such as `tsx`:

```bash
npx tsx lib/db_script.ts
```

The target table must provide these columns:

```sql
CREATE TABLE songs_spotify (
	id SERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	artist TEXT NOT NULL,
	year INTEGER,
	track_id BIGINT UNIQUE NOT NULL
);
```

`lib/dataset_utils.ts` also supports the included `assets/Spotify Most Streamed Songs.csv` as an alternate source format, but the active ingestion source is `songsArray`.

## API Routes

### `GET /api/song/random/:clientId`

Returns a random catalog song plus its Deezer preview URL. The route retries up to ten times when a selected track is unavailable, has no preview, or is inactive for that client.

### `GET /api/autocomplete?q=<query>`

Returns up to eight title/artist matches from Postgres. Queries shorter than two characters return an empty result, and the client debounces requests by 250 ms.

## Project Structure

```text
app/
	page.tsx                         Home screen
	play/page.tsx                    Game state, audio, guesses, and round UI
	api/autocomplete/route.ts        Song search endpoint
	api/song/random/[clientId]/      Random song endpoint
components/ui/                     Game and shared UI components
lib/
	db_script.ts                     Catalog ingestion
	songs_array.ts                   Current catalog source stand-in
	spotify_utils.ts                 Intended Spotify playlist source
	deezer_utils.ts                  Deezer matching and previews
	redis_utils.ts                   Per-client cooldown storage
	create_pool.ts                   Shared Postgres pool
assets/                            Optional CSV catalog source
```

## Notes

- A browser-generated `clientId` is stored in `localStorage`; it is not an account or authentication system.
- Redis cooldown keys use the form `used:<clientId>-<trackId>` and expire after 48 hours.
- The game depends on Deezer preview availability. A valid database row alone is not enough for a playable round.
