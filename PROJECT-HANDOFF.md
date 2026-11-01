# Chandani implementation handoff — 2026-10-30

## Non-negotiable design context

Chandani is a whole-home brand: furniture, carpets, other home products, kitchen/interior design. The user approved the CURRENT prototype. Preserve its hero, photography, typography, colours, spacing, navigation, categories, product cards and overall composition. The hero must still become the room explorer. Do not introduce a component-library look, remove features, change imagery or turn the business into a carpet-only brand.

The original prototype is in `source/`. Root `index.html` and `atelier.html` are generated standalone bundles with embedded assets; do not implement there. The original source and all assets were left unchanged during this migration. `DESIGN-HANDOFF.md` and root `VERIFICATION.json` describe the historical prototype, not the React validation status.

## Implemented

The application is in `react-app/` using React 19.3.1, Vite 8.3.4, TypeScript 6.0.3 and React Router. Node checked: 26.12.1. Read `react-app/README.md` for exact commands.

- Homepage and carpet-studio routes, with old `.html` redirects, category/room/hotspot/product/carpet query links and legacy shortlist-link import.
- React header/mobile navigation, hero/explorer, category directory, product collection/cards/details, search including no results, shared local shortlist, kitchen feature, enquiry forms/drafts, carpet studio and TryRoomDialog.
- Original CSS/assets/font/licence copied byte for byte. Static structure/text/classes/image references match the two reference pages. Extra styles are scoped to configuration and expanded carpet view.
- Product, shortlist and kitchen enquiry drafts keep fields and selected product/palette snapshots while editing. Closing/reopening during the visit retains the last fields for that interest. Nothing is sent. Draft text is intentionally not stored across reloads.
- Native dialogs with focus restoration and Escape handling; comparison preload/retry and stale-load protection; all furniture, carpet and kitchen comparisons; day/evening/reset; in-page expansion.
- Per-room/per-slot configuration, validated immutable updates, current state persistence and explicit saved restore point. The disclosure inside Try the room offers accurate supported carpet-study choices and shows one-model furniture slots as text.

## Important architectural boundaries

`data/service.ts`: replaceable async content adapter. `data/sample.ts`: illustrative products, scenes/hotspots, comparison mappings. `data/configuration.ts`: product/variant definitions per slot. `state/configuration.ts`: configuration transitions/restore validation. `data/rendering.ts`: explicit flat-study rendering capabilities. `state/AppContext.tsx`: shared shortlist, configuration, dialog entry and enquiry state. Components use callbacks/hooks, not global content or HTML-string templates. `useDialog` is the sole native-dialog/body-lock focus hook.

Backend is still undecided (Django or Node). No backend, authentication, checkout, stock/prices, service claims or live messaging was added. Product names and pictures remain illustrative.

## Live swapping limitation — do not erase this distinction

The current pictures are opaque RGB flattened scenes and one-item removal edits. The wide hero and carpet study use different cameras. A slider or whole-room image change is **not independent furniture swapping**. No alternate sofa models or independent layer pack exists. Do not invent them or expose nonfunctional controls.

Configuration state is prepared, but actual sofa → carpet → table compositing requires matched transparent object/shadow/occlusion layers and a shared clean background. Exact room dimensions, existing files, minimum asset pack, renderer requirements and acceptance criteria are in `react-app/docs/ASSET-REQUIREMENTS.md`; machine-readable inventory is `ASSET-AUDIT.json`. Start with practical 2D layers after those assets are approved.

## Validation completed and remaining

Passed: production Vite build; strict TypeScript; 11 state/content tests across two files; rendered React route checks; six structural composition comparisons (header/main/footer on home and studio); byte-equality of both CSS files, all 20 images, font and licence. Unit tests explicitly prove carpet changes preserve sofa/table and other rooms, and saving/restoring is independent of later changes.

**Browser validation completed:** Headless Chromium with Playwright Core ran against the local HTTP server. The suite (`tests/browser.mjs`) verified:
- 10 interaction check suites including room exploration, category filtering, search, empty results, all 10 product comparisons, dialog focus containment and restoration, shortlist persistence, enquiry drafts, and carpet studio.
- 0 application console errors.
- 4 responsive viewports (320px, 390px, 768px, 1440px) with 0 horizontal overflow across home, try-room, expanded-try-room, and carpet-studio.
- 44px minimum touch targets across room dialog controls.
- Visual region comparison with reference layouts matching within threshold.
- Live reduced-motion preference changes, image crossfades, and day/evening glass toolbar screenshots.

Runtime/build dependencies came from an offline npm cache; TypeScript came from the installed system compiler of the same pinned version. Clean `npm ci` with network access is another pending environment check. The lockfile's uncached TypeScript/Playwright entries omit integrity hashes; refresh them with `npm install --package-lock-only` on a networked system.

## Next steps

1. Read this handoff, `react-app/README.md`, `react-app/VERIFICATION.json` and `react-app/docs/CONTENT-CHECKLIST.md`.
2. Inspect the generated screenshot artifacts in `react-app/test-results/browser/` (320, 390, 768, 1440 widths and day/evening glass toolbars).
3. Obtain the matched living-room layer pack before implementing independent sofa/carpet/table swaps (see `docs/ASSET-REQUIREMENTS.md`).
4. Perform physical screen-reader and device audits on Safari/Firefox.

## Follow-up: easier access to Try the room

The user requested a more accessible Try the room experience after the migration. Targeted changes are in `src/enhancements.css` and the React components; original source/CSS/assets remain unchanged.

- Direct desktop-navigation entry, stronger filled launcher below the hero (full width on mobile), and Try the room first in the mobile menu. Existing hero/explorer and product entry points remain.
- Room dialog controls have a minimum 44px target; mobile room choices wrap into two columns; smaller explanatory text is increased and focus outlines strengthened. High-contrast system colours have explicit focus/selection treatment.
- Shared comparison component adds −/+ buttons for 10-point adjustments, a visible percentage and keyboard instructions linked to the native range input. Its accessible name/value describe the actual sofa/carpet/kitchen views. The controls remain in expanded view. Image-load retry returns focus to the divider once ready.
- Named control groups, hidden decorative arrows/swatches and an in-dialog live status for shortlist/configuration feedback. Native modal behavior and Escape order retained.

Validation after this change: production build, strict TypeScript, existing state/content tests and 10 markup checks passed. Markup comparison explicitly excludes the new `nav-try-room` and `comparison-adjust` affordances; their semantics are checked separately. The browser suite now checks header entry, focus return, −/+ controls, Home/End, contextual names, 44px targets and expanded controls, plus pixel comparisons of unchanged page regions. Full-page screenshots require review for the intentional accessibility differences. Browser execution remains blocked by `listen EPERM`; native keyboard/touch, screen-reader and visual checks are still pending. No WCAG conformance claim is made.

Pattern references used: [WAI slider guidance](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) and [modal dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Follow-up: Motion and one warm glass surface

The user selected Motion + React Bits Glass Surface, while retaining the approved warm whole-home aesthetic. The React app now uses Motion **14.3.0** (compatible with React 19) through `LazyMotion`/`m` and `MotionConfig`. Packages were installed from the npm cache; new lock entries retain registry integrity hashes. Existing install/browser environment limitations still apply.

- `Interactions.tsx` supplies a provider, restrained button feedback and one-time section entrances. Native section/button DOM, classes and layouts are retained. Section content starts visible; keyboard focus completes an entrance. No scroll pinning or parallax.
- `CrossfadeImage.tsx` adds short image crossfades to the hero room explorer and both comparison experiences. Existing image-pair loading/retry and stale-request cancellation remain authoritative. Previous loaded images are retained during loading; outgoing layers are decorative and removed after fading. Room hotspots wait for their photograph, and initial explorer focus waits for it to load.
- `GlassSurface.tsx`/CSS adapt React Bits' rounded SVG displacement-map renderer to one static, warm toolbar for Day/Evening/Expand in Try the room. Small refraction, high-opacity warm background and clear selected/focus states. Safari/Firefox get frosted glass; unsupported backdrop filtering gets a solid surface. Below 761px the toolbar flows beneath the photograph to keep the narrow divider area usable. Expanded view keeps the same controls.
- `useMotionPreference.ts` subscribes to OS changes with `useSyncExternalStore`. The installed Motion `useReducedMotion` implementation only snapshots its initial setting, so a live subscription explicitly disables all new fades/transforms and cancels in-flight image transitions. CSS also handles reduced transparency and forced colours. No perpetual animation loop.
- Full React Bits **MIT + Commons Clause** attribution is in `react-app/docs/REACT-BITS-LICENSE.md`; notices for React Bits and Motion ship under `public/licenses/`. The SVG data URL generated by the glass component is a gradient displacement map, not an embedded photograph. All original images, CSS and font/licence remain byte-identical.

Validated: production build, TypeScript, all 11 state/content cases, six preserved page-composition checks plus dialog/navigation/motion-fallback checks (11 markup checks total). The markup checks verify visible initial content and exactly one fallback glass toolbar with native labelled controls. No new exclusions were needed for the approved page composition.

Browser suite executed with Chromium: day/evening toolbar screenshots captured, room crossfade cleanup verified, live reduced-motion changes exercised, touch targets tested at >=44px, and 0 console errors recorded. Visual region comparison passed across 320, 390, 768, and 1440px widths. Before public deployment, conduct manual audits on native Safari and Firefox devices to check browser-specific backdrop-filter and SVG displacement behavior. These changes do not implement independent furniture swapping; the missing-layer requirements remain unchanged.

References: [Motion React](https://motion.dev/docs/react), [Motion accessibility](https://motion.dev/docs/react-accessibility), [React Bits Glass Surface](https://reactbits.dev/components/glass-surface).
