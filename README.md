# Copperhead County

[![gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/JACKETAGENT-ID/gta6-01-zech/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/JACKETAGENT-ID/gta6-01-zech/reward.svg)](https://make.fun/bounty/gta6-01)

An original 2D top-down open-world crime game for the [make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01) — built from scratch in vanilla JavaScript, no libraries, no network requests, no assets from any commercial game.

## The story

Rook Calloway, getaway driver, owes **$4,000** to Vera Voss, who runs the Copper Spur strip. Six jobs stand between Rook and freedom: steal a sedan for Duke, run a package up the highway, dig copper nuggets out of the desert, survive a full sheriff heat wave, carry Vera's chips down the casino strip, and haul one last van of copper to the Gold Pan Saloon.

## What is in the game

- **Open world** — a desert county grid with a highway, the Spur Avenue casino strip (The Copper Spur, Desert Rose Casino, Lucky Coyote, Gold Pan Saloon), garages, a diner, a clinic and a sheriff office.
- **On foot + driving** — walk, sprint, dodge-roll; drive five stealable vehicle types (sedan, pickup, motorbike, bus, van), each with its own speed and handling.
- **Traffic & pedestrians** — 15 cars on three road loops and 26 pedestrians who walk the sidewalks and flee from gunfire.
- **Wanted system** — 0–5 stars. Sheriff cars chase and ram you, roadblocks appear at 3+ stars, and getting caught means a fine and a trip to the sheriff office.
- **Six story missions** with dialogue, timers, deliveries and an escape — finishing the last one clears the debt.
- **Combat** — pistol (mouse aim, click to shoot) and punching (F). Crime raises your wanted level.
- **HUD + minimap** — cash, debt, health, ammo, speed, wanted stars, live minimap with mission marker, radio station and objective tracker.
- **Sound** — fully procedural WebAudio: engine hum, two-tone siren, gunshots, and three radio stations (desert country, dust rock, neon synth).
- **Day cycle & dust storms** — dawn, noon, dusk and night tints; random dust storms cut visibility.
- **Collectibles** — 20 copper nuggets hidden around the county, $25 each.
- **Save** — progress auto-saves after every mission (localStorage); continue from the title screen.

## How to play

Serve `game/` with any static server and open `index.html` in desktop Chrome:

```
node serve.ts        # or: python3 -m http.server --directory game 8080
```

| Key | Action |
| --- | --- |
| WASD / Arrows | Walk & drive |
| E | Enter / steal car, talk, interact |
| Mouse + click | Aim & shoot the pistol |
| F | Punch |
| Space | Brake (car) / dodge roll (on foot) |
| Shift | Sprint |
| R | Change radio station |
| M | Mute |
| P / Esc | Pause (save from the pause menu) |

## Layout

- `game/index.html` + `game/css/style.css` — page and styling
- `game/js/` — one file per system: `main` (loop), `config` (data), `world` (map gen), `player`, `vehicles`, `pedestrians`, `police`, `missions`, `combat`, `collectibles`, `hud`, `render`, `audio`, `input`, `save`, `shots`
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — four real renders of the game (title, driving, sheriff chase, casino mission)

## License

MIT. Everything in this game — city, characters, vehicles, names, story, art and music — is original.
