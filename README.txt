CHANDANI — REACT APPLICATION (CURRENT DEVELOPMENT)

The approved prototype has been migrated into react-app/ using React, Vite and
TypeScript. The original source/ pages and standalone HTML remain the reference.

INSTALL AND DEVELOP
Use Node 22.18+ (or Node 24/26) and npm. From this project directory:

cd react-app
npm ci
npm run dev

Open Vite's printed URL (normally http://127.0.0.1:5173).

VALIDATE AND BUILD
Inside react-app/:

npm run typecheck
npm test
npm run test:markup
npm run build
npm run preview

The markup check also uses Python 3, standard library only. Serve the production
react-app/dist/ directory over HTTP with an index.html fallback for React routes.

BROWSER CHECKS
With a locally installed Chromium:

CHROMIUM_PATH=/usr/bin/chromium npm run test:browser

The suite checks desktop/mobile behavior and captures paired original/React
screenshots at 320, 390, 768 and 1440px. See react-app/README.md for prerequisites.

CURRENT STATUS
Build, strict TypeScript, 11 state/content tests and static composition checks pass.
Original CSS, imagery, font and licence are preserved byte for byte. The migration
includes the hero/explorer, catalogue, search, shortlist, kitchen enquiry drafts,
carpet studio and product-specific room comparisons. Room/slot selections support
local persistence and saving/restoring a set. Carpet colours and bare floor use
the existing fixed carpet study; independent sofa/table model swaps require new
matched transparent layers, shadows, masks and a shared empty background.

Interaction polish now uses Motion for gentle section entrances, image crossfades
and button feedback, plus one React Bits-based warm glass room toolbar. Reduced
motion, reduced transparency and unsupported filter fallbacks are included. The
toolbar moves below narrow room images so the divider remains accessible. Source
attribution and licence notices are retained in react-app/docs/ and public/licenses/.

Browser interaction, visual comparison, touch target and overflow checks passed
under Chromium via tests/browser.mjs (10 interaction test suites, 0 console errors,
and no horizontal overflow across 320, 390, 768, and 1440px viewports). Paired
screenshots are recorded in react-app/test-results/browser/. No deployment was performed.

READ BEFORE CONTINUING
PROJECT-HANDOFF.md — design constraints, implementation progress and next work.
react-app/README.md — exact commands, routes, architecture and limitations.
react-app/VERIFICATION.json — React check results, separate from the prototype.
react-app/docs/ASSET-REQUIREMENTS.md — missing visual assets and renderer requirements.

----------------------------------------------------------------------
ORIGINAL PROTOTYPE DOCUMENTATION (RETAINED FOR REFERENCE)
----------------------------------------------------------------------

CHANDANI — TRY THE ROOM / WHOLE HOME DESIGN PROTOTYPE

OPEN
Extract Chandani-Try-The-Room.zip and open index.html in the Chandani-Try-The-Room folder. Keep atelier.html beside it. Both pages bundle the images, font, styles and scripts for offline use; JavaScript must be enabled.

ARCH LINUX
unzip ~/Downloads/Chandani-Try-The-Room.zip -d ~
xdg-open ~/Chandani-Try-The-Room/index.html

THIS IS THE DESIGN STAGE
This edition expands Chandani from a carpet-only presentation to furniture, carpets and interiors, including kitchen design. It is an interactive HTML design prototype, not the final React application or a backend. No publishing or deployment has been performed.

TRY THE ROOM — ADDED IN THIS EDITION
- Choose Try the room in the bar directly below the hero, or from the mobile menu.
- Every product detail has a Try in the room button that opens its matching item.
- Living: sofa, carpet and side table. Dining: table and chairs. Bedroom: bed, table light and wardrobe. Kitchen: before/after design concept.
- Drag the divider, or use the arrow keys when the slider is focused. With piece and Without piece show each full view; Compare returns to a useful split through the selected item.
- Carpets retain Clay, Chalk and Ink colour choices and the bare-floor comparison.
- Day/Evening, Reset view, Expand, shortlist and relevant enquiry actions are included. Escape first exits an expanded view, then closes the room dialog.
- The approved homepage, hero, category grid, catalogue and carpet studio design are preserved.
- This is an illustrative with/without comparison of each sample piece. It does not upload a customer room, place arbitrary furniture or simulate product sizes.

EXPLORE
- The hero becomes the room explorer when you choose Explore this room.
- Switch between living, kitchen, bedroom and dining scenes.
- Select numbered hotspots to view a product concept or kitchen design idea.
- Browse seating, carpets, dining, bedroom, lighting/decor and storage.
- Search the ten sample products or kitchen design. On mobile, search is inside Menu.
- Save different product types to one shortlist, retained in this browser and carried in internal links.
- Open the carpet studio from a carpet detail or the footer to compare Clay, Chalk and Ink against the bare floor.
- Prepare product, shortlist, whole-home or kitchen enquiry drafts. Kitchen drafts include layout and dimensions. Copy or edit your draft; nothing is sent.

EDITABLE SOURCE
source/index.html and source/atelier.html: page structure.
source/style.css: design system, layouts and responsive rules.
source/catalogue.js: sample catalogue and scene/hotspot content, separate from interface behavior.
source/app.js: existing prototype interactions and shared shortlist/enquiry hooks.
source/try-room-data.js: comparison scenes and product mappings.
source/try-room.js: the added room dialog and interactions.
source/try-room.css: scoped styles for the added feature.
source/assets/: bundled WebP concept imagery.
source/fonts/: Manrope font and license.

Edit source files and run python3 build.py from the extracted folder to regenerate both standalone HTML files. Python's standard library is enough. The separate source pages can also be served by your usual local development server.

REAL CONTENT TO SUPPLY
The user confirmed that Chandani sells sofas, carpets, other home products and provides kitchen design. Additional category organization, product names, palettes and images in this edition are illustrative design content. Actual inventory, specifications, services, prices, photography, address and contact destinations have not been supplied. No checkout, stock availability, price, delivery promise or business testimonial is fabricated.

See DESIGN-HANDOFF.md for the proposed React/component and content structure. See VERIFICATION.json for checks and limits. ASSET-PROMPTS.md records concept-image provenance and generation directions.
