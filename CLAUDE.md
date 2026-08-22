# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

The marketing website for Miguel's Restaurante (Ridgeland, MS), plus the asset pipeline that produced its photography. Not a git repo, no package manager, no build step — the deliverable is static HTML/CSS/JS.

## The site

`site/` is the whole deployable artifact:

- `site/index.html` — single-page site (hero, pillars, story, dishes, lunch/dinner menus, visit section), ~410 lines, no templating
- `site/css/styles.css` — one stylesheet, organized in commented sections (`/* ---------- hero ---------- */`, `pillars`, `story`, `dishes`, etc.) — find the right section before adding rules rather than appending at the end
- `site/js/main.js` — one IIFE driving the hero's scroll choreography (headline/nav fade → veil lifts → video un-zooms as the visitor scrolls through the 180vh hero section) plus the mobile call-bar reveal. Read the comments at the top of each function — the conditions (`prefers-reduced-motion`, `innerWidth < 900`, `navigator.connection.saveData`) are deliberate, not defensive boilerplate.
- `site/assets/photos/` — optimized, web-ready assets actually referenced by `index.html` (`.webp` images, one `.mp4` hero clip)
- `assets-source/` (repo root, deliberately **outside** `site/`) — full-resolution originals for the assets that have no counterpart elsewhere in the repo. It lived at `site/assets/_source/` until it was moved out: inside the publish directory Netlify served the masters publicly and re-uploaded 45 MB per deploy. See `assets-source/README.md` for the inventory and the `magick`/`ffmpeg` commands to re-derive the optimized versions.
- `site/review/` — before/after screenshots (desktop + mobile) from a past design review pass, not part of the live site

**To preview the site**: it's static — open `site/index.html` directly or serve `site/` with any static file server. No dev server config exists in this repo.

## Asset pipeline (outside `site/`)

Everything at the repo root except `site/` is working material for producing the site's photography and is not shipped:

- `for-claude-design/photos/` — the source photo/video set (real restaurant photos) handed to a Claude Design project; this is the canonical source of truth for original, unedited assets
- `restyle.sh` — bash script that re-plates/restyles dish photos via the `muapi` CLI (`nano-banana-pro-edit` model), one `run slug url aspect prompt` call per dish, writing outputs + cost metadata to `final/*.json` and `final/*.png`
- `bakeoff/`, `labeled/`, `cleaned/`, `new-shots/`, `final/`, `from-facebook/` — intermediate and comparison outputs from iterating on image-generation models/prompts (e.g. `labeled/` filenames encode model + cost, like `ribeye_B-seedream-5-edit_0.03.jpg`)
- `video/` — hero video candidates (tomahawk smoke/steam push-ins, kitchen grill action, oyster steam orbit)
- `.env` — holds `MUAPI_API_KEY` for `restyle.sh`; gitignored

When adding a new restyle pass, follow `restyle.sh`'s existing `run()` pattern rather than introducing a new invocation style.

## Design exploration (`design/`)

`design/*.dc.html` are Claude Design canvas artboards (`OptionA-NeonSign`, `OptionB-QuietKitchen`, `OptionC-FamilyTable`) from an earlier design-direction exploration, wired together by `design/canvas.json`. `design/Main.dc.html` and the two `miguels-restaurante-*.html` files are standalone design drafts (hero, directions section). These are design artifacts, not part of the live site — don't treat them as a second source of truth for `site/`.
