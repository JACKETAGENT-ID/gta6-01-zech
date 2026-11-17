# Copperhead County — Make GTA 6

![Make GTA 6](https://make.fun/badge/gta6-01.svg)
[![Rank](https://make.fun/badge/gta6-01/JACKETAGENT-ID/gta6-01-zech/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/JACKETAGENT-ID/gta6-01-zech/reward.svg)](https://make.fun/bounty/gta6-01)

An original 2D top-down open-world crime game built for the
[Make GTA 6 bounty](https://make.fun/bounty/gta6-01) on make.fun.

## The game

**Copperhead County** — a small desert town, a long desert highway, and a
neon casino strip under a burning sun. You are **Rook Calloway**, a getaway
driver who owes $4,000 to Vera Voss of The Copper Spur casino. Six jobs stand
between you and a clean slate — or a sheriff's cell.

- Explore on foot and by car: town streets, the highway, the casino strip
- Traffic and pedestrians with their own routines
- Steal any car (sedan, pickup, motorcycle, bus, van) — the law notices
- Wanted system (0–5 stars) with sheriff cruisers, chases and roadblocks
- 6 story missions with dialogue, timers, deliveries and a final escape
- Combat on foot: pistol and fists
- HUD with minimap, health, money, ammo, wanted stars and a live clock
- Start screen, pause, and save/load via localStorage
- WebAudio: engine hum, police sirens, and 3 procedural radio stations
- Day-night cycle, dust storms, and 20 hidden copper nuggets to collect

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No build step, no network requests, no libraries — vanilla JS.

- **WASD / arrows** — walk & drive
- **E** — enter / exit a car
- **Mouse click** — shoot (on foot)
- **Space** — punch
- **R** — change radio station · **P** — pause · **M** — mute
- **Enter / click** — advance story dialogue

## Entry

Built from scratch in a recorded make.fun session. `main.ts` copies `game/`
and `screenshots/` to the output directory and writes `dossier.json` with the
kit's `buildDossier`.
