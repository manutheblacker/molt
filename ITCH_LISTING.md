# MOLT — itch.io listing copy

## Cover image

- `art/molt-itch-cover-630x500.png` — upload this one as the itch.io cover / front image (630 × 500).
- `art/molt-itch-cover.png` — 2× version (1260 × 1000) for store pages or promo use.
- `art/cover.html` — editable source for regenerating the cover.

## Screenshots

Upload these to the itch.io gallery in this order (all 1280 × 720):

1. `art/screenshots/01-title.png` — title screen
2. `art/screenshots/02-select.png` — five-fighter select screen
3. `art/screenshots/03-fight.png` — close-range exchange
4. `art/screenshots/04-special.png` — GEX's Tongue Snatch
5. `art/screenshots/05-options.png` — custom controls and audio options

The 2× source files are in `art/screenshots/2x/` if you need them later.

## Title

MOLT — Street Specimens

## Short description / tagline

Five lab-grown insects. One rooftop. Best of three. No mercy.

## Long description

Five lab-grown insects. One rooftop. Best of three. No mercy.

MOLT is a minimalist 2D fighting game about very small creatures with very large grudges. Pick a specimen, learn its reach, and put the other bug through the roof.

**FIGHT WITH INTENT**

Every normal has startup, active, and recovery frames. Block standing or crouching, punish whiffs, cancel into specials, and make counter-hits count. Specials cost 50 meter, and meter carries between rounds. First to two rounds takes the rooftop.

**THE ROSTER**

- **BLATE / Stag beetle** — Slow armored bruiser. Horn Cannon absorbs one hit on the way in.
- **ANTIX / Bullet ant** — Fast pressure. Swarm Flurry is six hits of bad news.
- **SKUT / Cockroach** — Fastest legs in the cast. Filth Rush hits three times.
- **GEX / Leopard gecko** — Longest normals on the roof. Tongue Snatch reaches across it.
- **SKITO / Mosquito** — Floaty aerial rushdown. Blood Dive heals on contact.

**TWO PLAYERS, ONE KEYBOARD**

Take on the CPU or a friend in local 2P. 60-second rounds, best of three, with touch controls on phones and tablets.

**YOUR KEYS, YOUR MIX**

Rebind both players' actions from OPTIONS. Music, SFX, and all-audio mute are independent. Settings save automatically between visits.

**PLAY IN YOUR BROWSER**

MOLT runs directly on this page. There is nothing to download or install.

1. Click **Run Game** above.
2. Click once inside the game to enable audio. Browsers block sound until you interact with the page.
3. Use the keyboard for local 2P, or the on-screen controls on phones and tablets.
4. Press `Esc` or `P` to pause. Press `M` to mute everything.

For the best experience, use a modern browser such as Chrome, Firefox, Safari, or Edge. On mobile, rotate to landscape.

**RUNNING THE DOWNLOADED ZIP LOCALLY**

The download is the same game as the browser version. It does not need to be installed, but it must be opened through a local web server. Opening `index.html` directly will not work.

1. Unzip the download.
2. Open a terminal in the unzipped folder.
3. Start a local server:
   - macOS / Linux: `python3 -m http.server 8080`
   - Windows: `py -m http.server 8080`
4. Open <http://localhost:8080> in your browser.
5. Press `Ctrl+C` in the terminal when you are done.

You need Python 3 for the commands above. If you have Node.js instead, run `npx serve .` and open the URL it prints. These instructions are also included as `HOW_TO_RUN.txt` in the zip.

Pick a bug and press forward.

## How to publish this on itch.io

1. Open <https://itch.io/game/new>.
2. Set **Title** to `MOLT — Street Specimens`.
3. Set **Kind of project** to **HTML**.
4. Paste the short description above into the **Short description / tagline** field.
5. Paste the long description above into the **Description** field, including the **Play in your browser** and **Running the downloaded zip locally** sections.
6. Upload the cover image: `art/molt-itch-cover-630x500.png`.
7. Upload the five screenshots from `art/screenshots/` in numbered order.
8. Upload `dist/molt-itch.zip` in the **Uploads** section.
9. Check **This file will be played in the browser**.
10. Set the embed viewport to **1280 × 720**, enable fullscreen, and set mobile orientation to **landscape**.
11. Add the suggested tags, save the project, and open the public page to test the game.

## Suggested tags

`fighting`, `2d`, `local multiplayer`, `versus`, `insects`, `arcade`, `minimalist`, `browser`, `procedural`
