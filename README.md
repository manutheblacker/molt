# MOLT — Street Specimens

A minimalist 2D insect fighter that runs in the browser. No frameworks, no build step to play, no runtime downloads. Five specimens, one rooftop, best of three.

## Run it

```bash
npm start
```

Then open <http://localhost:5173>. Any static server works, but the game uses ES modules, so it needs to be served over HTTP. Opening `index.html` directly from disk will not work.

## Controls

Defaults:

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | `A` / `D` | `←` / `→` |
| Jump / crouch | `W` / `S` | `↑` / `↓` |
| Light | `F` | `,` |
| Heavy | `G` | `.` |
| Special (50 meter) | `H` | `/` |
| Block | hold back | hold back |
| Pause | `Esc` / `P` | — |

- Crouch + heavy is a sweeping low knockdown.
- Standing block stops mids and jump-ins; crouch block stops mids and sweeps. Jump attacks are overheads.
- Specials cost 50 of the 100-point meter. Meter carries between rounds.
- `M` toggles the global mute. `Esc` pauses. On the results screen: `Enter` rematch, `C` change fighters, `Esc` title.
- Touch controls appear automatically on coarse-pointer devices.

## Options and custom commands

From the title screen choose **OPTIONS**. Settings are saved in `localStorage` under `molt.settings.v1` and persist across reloads.

- **P1 KEYS / P2 KEYS** — select an action and press any key to rebind it. If the key is already used by another action on the same player, the two actions swap. A key used by the other player is rejected so local 2P stays clean.
- **AUDIO** — toggle **MUSIC** (the synthesized fight loop), **SFX**, and **MUTE ALL** independently. Each tab also has a reset row.
- `Esc`, `M`, and `Backspace` are reserved for pause/back/mute. Rebind capture uses `Esc` to cancel.
- On keyboard, `↑` / `↓` selects a row, `←` / `→` changes tab, `Enter` changes a value, and `Esc` goes back. On touch, the d-pad navigates and `LT` confirms; the pause button also acts as Back in menus.

The defaults live in [`src/config.js`](src/config.js). Edit `DEFAULT_CONTROLS` or `DEFAULT_AUDIO` there to change what a fresh install starts with.

## Export to itch.io

Font license copies are included in the build.

```bash
npm run build:itch
```

The build script requires Node.js and the `zip` command (included with macOS and most Linux systems). It creates:

- `dist/` — a playable copy of the site
- `dist/molt-itch.zip` — the upload archive, with `index.html` at the archive root

Upload steps:

1. Create a new project on <https://itch.io/game/new>.
2. Set **Kind of project** to **HTML**.
3. Upload `dist/molt-itch.zip`.
4. Check **This file will be played in the browser**. If itch.io asks, choose the HTML option rather than a downloadable file.
5. Set the embed viewport to **1280 × 720**. Enable the fullscreen button and set the mobile orientation to landscape.
6. Save the project, then open its page and play a test match. The title screen is the best first check that the module, fonts, and audio all loaded.

No server or build step is needed by players: itch.io serves the files over HTTPS, which is all the ES modules need. If you update the game, rerun `npm run build:itch` and upload the new zip (bump the project version on itch if you like).

To preview the production files locally:

```bash
npm run preview:dist
# http://localhost:5174
```

## The roster

| Fighter | Species | Style |
| --- | --- | --- |
| BLATE | Stag beetle | Slow armoured bruiser; Horn Cannon ignores one hit. |
| ANTIX | Bullet ant | Fast pressure; Swarm Flurry is six hits. |
| SKUT | Cockroach | Fastest ground movement; Filth Rush hits three times. |
| GEX | Leopard gecko | Longest normal range; Tongue Snatch reaches across the roof. |
| SKITO | Mosquito | Floaty aerial rushdown; Blood Dive can be done in the air and heals. |

## Tech notes

- Canvas 2D, fully procedural art. Every fighter is drawn from a shared insect rig with custom heads, shells, wings, tails and poses.
- Fighting-game fundamentals: startup/active/recovery frames, hitstop, blockstun, hitstun, cancels, input buffering, chip damage, counter-hits, low/overhead blocking, wall pushboxes and combo scaling.
- All audio is synthesized with the Web Audio API, including the fight loop. Music and SFX settings are applied live.
- Local two-player and CPU versus, best-of-three rounds, 60-second timer.
- Built as a static site: `index.html`, `styles.css`, and `src/*.js`. Fonts are self-hosted under the SIL Open Font License; license copies are in `assets/fonts/`.
