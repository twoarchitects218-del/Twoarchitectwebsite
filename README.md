# TWO Architects — Gallery

A single-page gallery website for **TWO Architects**, Ahmedabad. The photography comes from www.twoarchitects.in.

It's plain HTML, CSS and JavaScript with no build step, so any static host works (GitHub Pages, Netlify, cPanel).

## What's on the page

- **Opening film:** a full-width video of eight featured projects (`assets/video/hero-reel.mp4`, with a `.webm` fallback).
- **Image wall:** 107 images (62 projects and 45 detail shots) in a masonry layout. You can filter by Architecture, Interior or Details, and switch between 2, 3 or 4 columns. The chosen filter is saved in the URL (for example `?filter=interior`), so a filtered view can be shared.
- **Viewer:** click any image to open it full screen. Use the arrow keys or swipe to move between images, and Esc to close.
- **Contact footer:** phone, email, studio address and social links.

## Adding images

1. Put the image in `assets/projects/` or `assets/gallery/`. Use WebP, about 1400px on the long edge.
2. Add it to `js/data.js`:
   - **Project:** add `{ "name": "...", "cat": "arch" | "interior", "img": "assets/projects/xyz.webp" }` to `projects`.
   - **Detail shot:** add the image path to `gallery`.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
