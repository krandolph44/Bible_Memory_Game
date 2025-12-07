
# Bible Verse Memorization — Final Build (Palette A, Parallax, Light Reveal, Safe Audio)

This build uses the working structure and adds:
- **Parallax light rays** (CSS-only) behind title content
- **Light reveal transition** between screens
- **Simple, safe audio**: toggle button (🎵 Off/On) for **title.mp3** (user-initiated only)

## Run locally
- `python -m http.server 8080` → open http://localhost:8080

## Publish on GitHub Pages
1. Upload these files at repo **root**.
2. Settings → Pages → Source: **Deploy from a branch** → Branch: **main** → Folder: **/ (root)** → Save.
3. URL: `https://<username>.github.io/<repo>/`

## Audio
- Place an MP3 named **title.mp3** in `assets/audio/`.
- Audio plays **only after you click** the 🎵 toggle (browser policy compliant).

## Customize
- Colors: edit `:root` in `style/styles.css`.
- Verses: update `LIB.ot` / `LIB.nt` in `script/main.js` (KJV/public domain recommended).

## Structure
```
index.html
style/  styles.css
script/ main.js
assets/
  images/  (SVG icons + title banner + divider)
  audio/   (README.txt + your title.mp3)
README.md
LICENSE
```
