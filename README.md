# White House

Website for White House, a restaurant with a pool and late-night parties.
Built with Vite, GSAP (ScrollTrigger, SplitText, DrawSVG), Lenis smooth scrolling and a Three.js water shader.

## Add your real details

Open `src/config.js` and fill in your phone, WhatsApp number, email and address.
Buttons and footer links appear automatically for every value you fill in.

## Run it locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The finished site is written to `dist/`.

## Put it online with GitHub Pages

1. In the repository, open Settings, then Pages.
2. Set Source to GitHub Actions.
3. Push to `main`. The workflow in `.github/workflows/pages.yml` builds and publishes the site.

## Notes

- Menu items, hours and party types in `index.html` are placeholders. Replace them with your real ones.
- The site respects "reduce motion" settings: no pinning, no smooth scroll, and a still water image.
