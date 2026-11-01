# Chandani React application

Faithful migration of the approved whole-home prototype in `../source/`. React, Vite and TypeScript; local illustrative content; no backend or message delivery.

## Install and run

Use Node **22.18+** (or Node 24/26) and npm. The project was built with Node 26.12.1 and npm 12.2.1. Vite's minimum is 22.12 in the selected Node major; 22.18+ also supports the TypeScript test runner used here without additional tooling. The selected Vite package declares `^20.19.0 || >=22.12.0`. See [Vite's compatibility guidance](https://vite.dev/guide/).

From the project root:

```bash
cd react-app
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`).

```bash
npm run typecheck
npm test
npm run test:markup
npm run build
npm run preview
```

`test:markup` also requires Python 3 (standard library only). `dist/` is the production output; serve it over HTTP. Configure hosting to return `index.html` for application routes such as `/carpet-studio`. This build assumes hosting at the domain root. No deployment was performed.

## Browser and visual validation

With Chrome or Chromium installed:

```bash
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

On another OS, set `CHROMIUM_PATH` to that browser's executable. Alternatively, install Playwright's matching browser with `npx playwright-core install chromium` and omit `CHROMIUM_PATH` if no system browser is detected. The test script starts its own temporary local HTTP server; it serves both the unchanged prototype and production React bundle. It exercises navigation, scenes, filters, empty search, all ten product-specific room entries, comparisons, keyboard/pointer input, lighting, expanded view, dialog focus, shortlist persistence, enquiry drafts and configuration save/restore. It checks overflow and writes paired full-page screenshots at **320, 390, 768 and 1440px**, plus a pixel-difference report in `test-results/browser/`.

**Execution status:** production build, strict TypeScript, 11 state/content tests, 11 markup/composition checks, and the full browser validation suite (`tests/browser.mjs`) have all passed. The browser test suite verified 10 interaction suites, zero application console errors, no horizontal overflow across 320/390/768/1440px widths, >=44px touch targets on room controls, and visual region comparisons within threshold. Output screenshots and reports are saved in `test-results/browser/`. See `VERIFICATION.json` for details.

The offline session used cached runtime/build packages and the system's TypeScript 6.0.3 compiler API. A fresh network-backed `npm ci` could not be exercised. The lockfile pins dependencies, including the official TypeScript and Playwright Core versions; their uncached entries have registry URLs without integrity hashes. `npm install --package-lock-only` with registry access can add those hashes. No environment-specific dependency paths are committed.

## Behavior and routes

- `/`: original hero connected to the room explorer, all categories and products, kitchen feature and enquiry entry points.
- `/carpet-studio?rug=clay|chalk|ink`: original carpet studio, day/evening, slider, reset, expanded view and saving.
- `/?category=carpets#collection`: category deep link. Supported values: `featured`, `all`, `seating`, `carpets`, `dining`, `bedroom`, `lighting`, `storage`.
- `/?room=bedroom&piece=wardrobe#home-room`: room and hotspot deep link. Kitchen hotspots also accept `layout`, `storage`, `finishes`.
- `/?product=sofa`: product details deep link, available on either route. Browser Back/Forward updates product selection.
- `/index.html` and `/atelier.html` redirect to the React routes while keeping query/hash values. Legacy `saved=sofa,ink` links are imported at initial load.

Try the room remains below the hero, in the mobile menu and in every product's details. The seven furniture comparisons, carpet colour/bare-floor comparison and kitchen before/after study are retained. Native dialogs contain focus and restore it on close; Escape exits the expanded room view before closing the room dialog. The carpet studio now uses an in-page expanded native dialog, so expansion does not depend on fullscreen permission.

The accessibility follow-up adds a direct desktop-navigation entry, a larger filled launcher below the hero and first-position access in the mobile menu. Room controls have 44px minimum targets, clearer focus outlines, readable instructions and named groups. The comparison divider has contextual screen-reader labels and −/+ alternatives that work in expanded view as well; arrows, Home and End remain native range controls. Shortlist/configuration feedback is announced inside the dialog. Browser and assistive-technology validation remain pending; these changes do not constitute a conformance certification.

## Motion and the room toolbar

The interaction polish uses [Motion for React](https://motion.dev/docs/react), pinned to **14.3.0**, and one local adaptation of [React Bits Glass Surface](https://reactbits.dev/components/glass-surface). The warm typography, product layouts and original photography remain intact.

- Gentle one-time section entrances (8px, 420ms), room/carpet image crossfades (240ms), and small hover/press feedback on primary actions and saved pieces. Content starts visible; keyboard focus completes a section entrance immediately.
- One warm glass toolbar groups Day, Evening and Expand in Try the room. It floats over the photograph on desktop. At widths of 760px or less it sits directly below the image, keeping the comparison divider clear. Expanded mode retains these controls.
- The glass uses restrained static SVG refraction where supported, with a frosted fallback for Safari/Firefox and a solid fallback without backdrop filtering. Text has a high-opacity warm backing; focus and selected states remain explicit. Reduced transparency and forced colours use solid surfaces.
- Reduced-motion changes are observed during the visit: fades and movement stop, and the toolbar becomes solid. This includes opacity animations, which Motion's default reduced-motion setting alone would retain. See [Motion's accessibility guidance](https://motion.dev/docs/react-accessibility).

`src/components/Interactions.tsx`, `CrossfadeImage.tsx`, `GlassSurface.tsx` and `src/hooks/useMotionPreference.ts` own these behaviors. The React Bits source and complete **MIT + Commons Clause** attribution are in [REACT-BITS-LICENSE.md](docs/REACT-BITS-LICENSE.md); licence notices also ship in `public/licenses/`. No extra visual assets or furniture variants were added.

Build, strict types, state/content tests and 11 static composition/semantics checks pass. The browser suite includes day/evening glass screenshots, room changes, live reduced-motion preference changes and responsive toolbar placement. These browser checks remain unexecuted because the sandbox denies local listening ports; visual quality, Safari/Firefox fallback rendering and animation timing need review in a normal browser.

Shortlist: browser-local storage at `chandani-home-shortlist`, with old `chandani-shortlist-v2` import and cross-tab synchronization. Room configurations: `chandani-room-configuration-v1` for current selections, `chandani-saved-room-configuration-v1` for a restore point. No account or server storage. Enquiry fields and drafts stay in React state during the visit; selected products and palettes are snapshotted. Drafts can be edited/copied. Reloading clears enquiry text; nothing is sent.

## Stage 2 boundary

“Keep your room selections” inside Try the room adds typed, validated state per room and slot, a supported carpet-study preview, and save/restore. Choosing a carpet preserves all other slot selections. Single-model furniture slots are informational text. Independently swapping furniture models is **not implemented**, because the original images contain no compositable layers or alternative furniture models. The original with/without controls remain separate comparison tools.

See [the asset audit and precise next requirements](docs/ASSET-REQUIREMENTS.md). The carpet study and wide hero use different cameras; the application does not pass either off as a composited configurator.

## Files and design constraints

`public/style.css` and `public/try-room.css` are byte-identical copies of the approved CSS. `public/assets/` and `public/fonts/` preserve every original asset, including the Manrope licence. Scoped additions live in `src/enhancements.css`. Assets are normal files, never base64 in application source.

`src/data/service.ts` is the replaceable async catalogue/room content boundary. `data/sample.ts` contains sample content. `data/configuration.ts`, `state/configuration.ts` and `data/rendering.ts` separate variant definitions, immutable selections and rendering capabilities. Components own their events and view state. The application uses no HTML injection, iframe wrapper, window catalogue globals or document-wide click delegation.

Read `../PROJECT-HANDOFF.md` before continuing. Preserve the approved composition, typography, spacing, colours, imagery and whole-home positioning. The original `source/` and standalone HTML files remain the visual reference.

The static comparison test excludes the explicitly added navigation entry and comparison adjustment bar while checking their accessibility semantics separately. The browser suite saves full-page before/after screenshots for review and applies its pixel threshold to unchanged regions (hero, catalogue, photography, editorial sections and footer). The new launcher/navigation/controls are intentional visual changes requested for accessibility.
