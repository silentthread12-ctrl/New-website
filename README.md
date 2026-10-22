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

## Change your details

- **Phone, WhatsApp, address, hours, map position, table types:** edit `app/src/config.js`.
- **Menu (dishes, descriptions, prices):** edit `app/src/menu.js`. Add `price: 350` to an item and it shows as "NPR 350".
- Booking requests are sent to the WhatsApp number in `config.js`. Make sure that number is on WhatsApp.

The dishes in `menu.js` (apart from the Nanglo set) are samples. Replace them with your real menu.

## How booking works

Guests pick a date, time, number of people and table, optionally add dishes from the menu, and press send.
WhatsApp opens with all the details filled in. You confirm the table by replying.
This site cannot check availability or store bookings by itself, because it has no server.

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
