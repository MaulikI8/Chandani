# Chandani — whole-home design handoff

> React implementation progress is recorded in `PROJECT-HANDOFF.md`. The original prototype notes below remain the design reference. Current React validation is in `react-app/VERIFICATION.json`.

> Latest approved interaction direction: subtle Motion reveals/crossfades/button feedback and one warm React Bits Glass Surface toolbar around the room experience. Preserve the original photographs, typography and composition; keep furniture visually prominent. Respect reduced motion and readable controls on light/dark imagery. See `PROJECT-HANDOFF.md` for implementation and pending browser review.

This is the visual and interaction reference for a later React application. The backend remains undecided between Django and Node. Neither has been implemented in this prototype.

## The updated brief

Chandani offers sofas, carpets and a broader home-product range, plus kitchen design. The homepage must immediately communicate that scope. Furniture and product browsing should coexist with a project enquiry path for a kitchen or an entire room.

The sample categories are a starting taxonomy: seating, carpets, dining, bedroom, lighting/decor and storage. They are not a verified inventory list. The final catalogue can add categories without changing the page structure.

## The experience

1. Enter through one calm living-room composition. The headline and imagery introduce the complete home.
2. Explore the same hero as a room. The headline gives way to numbered hotspots and one selected detail card, keeping the introduction and exploration connected.
3. Switch to kitchen, bedroom or dining. These are illustrative room schemes, not measured visualizations or proof that every pictured item is sold by Chandani.
4. Browse by product category or search by product, palette or category. Save multiple product types to one shortlist.
5. Use the carpet studio for its more focused colour and bare-floor comparison.
6. Start an enquiry about one piece, a shortlist, a whole room or a kitchen. The prototype only composes a local draft.

On mobile and tablets, room details move beneath the image. On desktop, the small detail panel sits inside the scene. Scene image proportions are kept stable in exploration mode so hotspot coordinates do not drift. Room changes scroll the scene into view; the design does not hijack scrolling or autoplay a carousel.

## Suggested React boundaries

| Component | Responsibility |
| --- | --- |
| SiteHeader / MobileNavigation | Shared navigation, search and shortlist entry |
| RoomExplorer | Active scene, intro/exploration mode, selected hotspot |
| RoomImage / HotspotLayer | Image framing and normalized interactive positions |
| RoomDetailCard | Product or kitchen-service idea linked to the selected hotspot |
| CategoryDirectory | Data-driven catalogue categories |
| ProductCollection / ProductCard | Filtering, count, image, details and saving |
| ProductDrawer / SearchDrawer | Accessible modal views and results |
| Shortlist | Product references, removal and enquiry selection |
| KitchenFeature / EnquiryForm | Project brief and service enquiry |
| CarpetStudio | Colour selection, comparison slider and visual lighting filter |

Keep product and room content separate from presentation. `source/catalogue.js` demonstrates this separation; it is sample content, not a production schema or API implementation.

## Content and data for the later build

- Category: ID, slug, title, ordering and imagery.
- Product: ID, slug, category, name, description, images and configurable attributes. Use category-specific attributes: upholstery for sofas, colour/size for rugs, finish/dimensions for tables, and so on.
- Variant: actual SKU, configurable values, image set and any confirmed availability/pricing. Do not force every product into carpet colourways.
- Room scheme: title, hero image, alt text, order and product/service hotspot references with normalized x/y positions.
- Service: kitchen/interior design content, scope and approved enquiry fields.
- Enquiry: selected product/variant references or service, room dimensions, layout preference, customer-provided contact details and message.
- Site content: real contact destinations, brand identity and approved business information.

A Django or Node API can supply this content. Select the backend based on the team's implementation and administration needs after the design and required business flows are settled.

## Decisions still needed before production

Actual category list and catalogue; whether the site sells directly or collects enquiries; product-specific configuration; real service scope; contact destinations; administration roles; stock/pricing rules; and approved photography and copy.

## Prototype boundaries

No backend, account system, admin interface, payment, order placement, stock feed or live message delivery. Shortlist storage is local to the browser. Room imagery and product names are concepts. Day/evening applies a visual filter, not lighting simulation. Do not carry example measurements, sample palettes or generated imagery into real product claims.

## Restored Try the room feature

This edition preserves the approved whole-home pages. A clearly named entry below the hero opens a separate comparison dialog. Product details and mobile navigation also open it. The original hero-to-hotspot interaction and dedicated carpet studio remain available.

`RoomTryDialog` owns room/item selection, image loading, compare position, visual lighting and the expanded preview. It shares product references, shortlist state and the enquiry flow with the rest of the site. The prototype adds only two custom events to the existing app: `chandani:sync` and `chandani:enquire`. A React version should use shared state and callbacks instead.

`source/try-room-data.js` maps all ten sample products and the kitchen concept to nine comparison subjects. The carpet subject supplies three colourways. A comparison entry needs: room ID, product/service reference, before and after image assets, image aspect ratio, accessible labels, and an initial divider position through the selected object.

The eight new “without” images are reference edits of the approved room pictures. The existing photos are unchanged. These are illustrative image pairs, not a 3D configurator or measured product placement. For production, use approved, camera-matched photography or renders with consistent lighting and geometry. Supply actual category-specific variants before adding sofa fabrics, timber finishes or cabinet configurations.

The expanded preview stays inside the page and does not require browser fullscreen permission. The dialog supports native focus containment and Escape; Escape collapses the expanded view before closing the dialog. Comparison images load together, stale selections cannot replace a newer choice, and failures show a retry action.
