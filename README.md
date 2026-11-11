# TWO Architects — website

A minimal, interactive static website for **TWO Architects**, Ahmedabad (architecture · interior · landscape). The content, projects and photography come from the current site, www.twoarchitects.in.

No build step and no framework: plain HTML, one stylesheet and one script. Any static host works (GitHub Pages, Netlify, Vercel, cPanel).

## Pages

| Page | File | What's on it |
|---|---|---|
| Home | `index.html` | Intro loader, full-screen project film, featured-project carousel, services, counters, process, awards |
| Work | `work.html` | All 62 projects, filters (Architecture & Landscape / Interior), grid and list views, lightbox |
| Studio | `studio.html` | Founders, the 13-person team, the studio film, awards |
| Services | `services.html` | Design & Documentation, Execution & Supervision, Redevelopment, Collaboration plans, testimonials |
| Gallery | `gallery.html` | Masonry gallery with lightbox |
| Contact | `contact.html` | Details, enquiry form (opens an email draft), map |

## Page-transition films

Clicking a link to another page plays a short film made from that page's own photography (for example "WORK" over Baljeet Apartments) before the next page opens. Each film ends on the site's background colour, so the cut is seamless.

- Films: `assets/video/transitions/<page>.mp4` (H.264), with `.webm` (VP9) fallbacks
- Home hero reel: `assets/video/hero-reel.mp4` (built from the eight featured projects)
- Visitors who turn on "reduce motion" skip the films and animations.

## Editing content

- **Projects and gallery:** `js/data.js`. Add an entry with `name`, `cat` (`"arch"` or `"interior"`) and `img`.
- **Images:** `assets/projects`, `assets/gallery`, `assets/team`, `assets/hero`. Use WebP, about 1400px on the long edge.
- **Text:** edit the HTML pages directly. The header and footer are repeated in every page.
- **Colours and fonts:** the tokens at the top of `css/style.css`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
