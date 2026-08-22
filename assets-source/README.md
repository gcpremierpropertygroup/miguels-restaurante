# Originals

Full-resolution sources for the optimised files in `../site/assets/photos/`.

This folder sits **outside `site/`** on purpose. It used to live at
`site/assets/_source/`, inside the deploy directory — which meant Netlify served
these masters to the public (a 7.8 MB hero clip was downloadable from the live
site) and re-uploaded 45 MB on every deploy. Keeping it out of `site/` is what
stops both; don't move it back in.

Only assets that exist **nowhere else in this project** are kept here. The seven
food shots that back `../site/assets/photos/*.webp` are not duplicated — their
originals are in `../for-claude-design/photos/`, which is the folder that fed the
Claude Design project. The two ambient clips are not duplicated either; their
originals are in `../video/` (see the table below).

| file | used for |
|---|---|
| `hero.mp4` | hero background clip (re-encoded to 344 KB in `../site/assets/photos/`) |
| `hero-portrait.mp4` | phone hero clip |
| `logo-mr-v2.png` | hero + footer wordmark |
| `chef-full-portrait.jpg` | Our Story portrait |
| `miguels-restaurante-sign.jpg` | Visit storefront photo |

`hero.mp4` is byte-identical to `../video/hero-tomahawk-smoke-push-in.mp4`; it is
kept here only because the hero pipeline is documented against this filename.

## Re-deriving the optimised files

Stills:

```
magick <src> -resize 1000x1000\> -strip -quality 82 out.webp
```

Hero clip:

```
ffmpeg -i hero.mp4 -vf scale=1280:-2 -c:v libx264 -crf 27 -maxrate 2000k \
  -bufsize 4000k -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

Ambient clips — sourced from `../video/`, and each shipped in two encodes because
`js/main.js` swaps to the mobile file below 700px. The band's phone encode is
re-framed, not just resized: the band is near-square on a phone, so a 16:9 frame
would lose ~40% of the shot to `object-fit: cover`.

Story clip, from `../video/kitchen-line-miguel.mp4` — desktop then mobile:

```
ffmpeg -i ../video/kitchen-line-miguel.mp4 \
  -vf "scale=1000:558:force_original_aspect_ratio=increase,crop=1000:558" \
  -c:v libx264 -crf 28 -maxrate 1400k -bufsize 2800k -pix_fmt yuv420p \
  -movflags +faststart -an kitchen-line.mp4

ffmpeg -i ../video/kitchen-line-miguel.mp4 \
  -vf "scale=1000:558:force_original_aspect_ratio=increase,crop=1000:558,scale=700:-2" \
  -c:v libx264 -crf 30 -maxrate 450k -bufsize 900k -pix_fmt yuv420p \
  -profile:v high -level 3.1 -movflags +faststart -an kitchen-line-mobile.mp4
```

Band clip, from `../video/kitchen-grill-action.mp4` — desktop then mobile. The
`crop=1080:1010:420` window is chosen so the flame, tongs and both steaks survive
the narrow frame; the 450k ceiling is safe because the band renders the clip at
`brightness(.28)`, where compression artefacts do not show.

```
ffmpeg -i ../video/kitchen-grill-action.mp4 -vf scale=1280:-2 \
  -c:v libx264 -crf 27 -maxrate 2000k -bufsize 4000k -pix_fmt yuv420p \
  -movflags +faststart -an band-grill.mp4

ffmpeg -i ../video/kitchen-grill-action.mp4 -vf "crop=1080:1010:420:35,scale=750:-2" \
  -c:v libx264 -crf 31 -maxrate 450k -bufsize 900k -pix_fmt yuv420p \
  -profile:v high -level 3.1 -movflags +faststart -an band-grill-mobile.mp4
```

Each clip's poster is one frame of its own encode, so the still and the video
show the same shot:

```
ffmpeg -i <clip>.mp4 -vf "select=eq(n\,36)" -frames:v 1 frame.png
magick frame.png -strip -quality 80 <clip>.webp
```
