# Room rendering audit and next assets

Audited 2026-10-30. `ASSET-AUDIT.json` records all 20 original files, dimensions, colour mode and file size. All are RGB WebP images without alpha. No original image was edited or replaced. `../../ASSET-PROMPTS.md` records the illustrative image provenance.

## What these assets can render

| View | Existing files | Supported use |
| --- | --- | --- |
| Homepage living room | `hero-chalk-wide.webp` (1919 × 820); `without-sofa.webp`, `without-side-table.webp` (1918 × 820) | The original hero/explorer and individual with/without comparisons |
| Carpet study | `room-clay.webp`, `room-chalk.webp`, `room-ink.webp`, `room-empty.webp` (1536 × 1024) | Immediate carpet colour/bare-floor changes within this fixed study |
| Dining | `dining.webp`, `without-dining-table.webp` (1881 × 836); `without-dining-chairs.webp` (1882 × 836) | Individual table and chair-set comparisons |
| Bedroom | `bedroom.webp` (1881 × 836); bed/light/wardrobe removal images (1882 × 836) | Individual bed, table-light and wardrobe comparisons |
| Kitchen | `kitchen.webp` (1881 × 836), `without-kitchen.webp` (1882 × 836) | Before/after design comparison |
| Product photography | Sofa square; three carpet product images, portrait | Catalogue presentation; unsuitable as room layers |

The carpet study is visibly a different room composition and camera position from the wide homepage hero. Its images must never be presented as carpet layers in the hero. The removal images reconstruct only the area behind one item. They are not a common empty background, alpha masks, or a set of independently compositable objects. The one-pixel width differences are inherited from the approved comparisons, whose renderer fills the established image frame. They are unsuitable for production pixel-aligned layering without correction at asset production time.

## Current implementation

`src/data/configuration.ts` contains the sample variants and slot definitions. `src/state/configuration.ts` owns immutable configuration updates and validated restoration. `src/data/rendering.ts` returns an explicitly named `flat-study` render plan; `RoomConfiguration` displays it. It never claims to be a layered renderer.

The configuration disclosure in Try the room shows each room's selections, allows Clay/Chalk/Ink/bare-floor changes in the carpet study, and saves/restores all rooms together. Other slots show the one available sample as text. There are no fabricated model options or inert swap buttons. The separate comparison slider is a viewing tool: “Without piece” does not remove that item from a saved configuration, and Reset view resets only comparison position and lighting.

## Minimum usable 2D layer pack for the intended sofa → carpet → table flow

Use the approved **wide living-room camera**, at one exact shared native resolution (1919 × 820 if retaining the current master). Supply:

1. A clean room background with **all configurable slots removed together**, including plausible wall/floor behind the sofa and table and the complete floor under the carpet. Retain fixed architecture and agreed fixed décor.
2. The default sofa and at least one genuinely different approved sofa model, each as a full-canvas RGBA PNG or lossless-alpha WebP. Same camera, perspective, real-world scale, floor contact, crop and lighting. The square studio sofa image is not a substitute.
3. Clay, Chalk and Ink carpet layers from this **same wide camera**, with accurate perspective and edges. Bare floor uses the clean background, not another whole-room photograph.
4. Default side table and at least one approved alternative, on that same canvas. Explicitly assign its vase, foliage, books and bowl to the table variant or separate layers so objects never float when the table changes.
5. Separate transparent contact/cast-shadow layers where shadows fall on the floor/carpet or another object. Define the blend mode, opacity and colour-space assumptions. Do not bake the existing carpet or sofa into another slot's shadows.
6. Occlusion masks or depth-separated layers for the fixed lounge chair, sofa legs, foreground carpet edges, table and any overlapping décor. The carpet must pass under furniture; objects must hide one another correctly in every offered combination. A single global z-order may be insufficient.
7. A manifest for each variant with product/variant reference, room/slot ID, native canvas dimensions, anchor/placement, scale, depth group, object/shadow/mask paths and compatible combinations. Include crop-safe areas and an accessibility description. Actual catalogue IDs and specifications must come from Chandani.

For dining, separate the near and far chairs and table so table/chair changes preserve overlaps. Supply a clean dining background and matched models/shadows/masks. For bedroom, provide a shared empty shell plus the bed, light and wardrobe layers with their real overlaps. Kitchen layout changes need coherent whole-design alternatives or a more detailed geometry pipeline; the current before/after pair is only one concept.

## Renderer once assets exist

Start with positioned RGBA image layers in a fixed-ratio scene; use canvas only if masking/blending requires it. Derive all rendered layers from the complete room configuration on every update. Preload each requested layer set and swap it atomically; ignore stale loads, retain the last valid complete scene on failure, and expose retry. Never overwrite another slot when choosing a variant. Keep the original comparisons available as a separate tool.

Acceptance must include sofa A → sofa B, then carpet Clay → Ink and table A → B, with the latest sofa preserved and no background/camera change or page reload. Repeat in reverse order; save/reload/restore; check every overlap, shadow, edge and scale on desktop and mobile. Do not enable model controls until this pack and those combinations have been visually approved.
