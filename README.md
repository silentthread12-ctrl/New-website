# White House

Website for White House, a restaurant with a pool and late-night parties.
Built with Vite, GSAP (ScrollTrigger, SplitText, DrawSVG), Lenis smooth scrolling and a Three.js water shader.

## How this repository is laid out

- The **repository root** holds the finished website (`index.html`, `assets/`, `favicon.svg`). GitHub Pages serves it directly.
- The **`app/` folder** holds the source code. You only need it to make changes.

## Publish on GitHub Pages

1. Open Settings, then Pages.
2. Set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Save. The site appears at `https://<your-username>.github.io/<repo-name>/` after about a minute.

## Add your real details

Open `app/src/config.js` and fill in your phone, WhatsApp number, email and address.
Buttons and footer links appear automatically for every value you fill in.
The menu, hours and party types in `app/index.html` are placeholders. Replace them with your real ones.

## Make changes

```bash
cd app
npm install
npm run dev      # live preview while you edit
npm run build    # rebuilds the finished site into the repository root
```

After `npm run build`, commit and push the changed files in the root (`index.html` and `assets/`) as well as `app/`.

## Notes

- The site respects "reduce motion" settings: no pinning, no smooth scroll, and a still water image.
