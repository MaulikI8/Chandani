# Chandani — Missing Content & Business Verification Checklist

This document tracks illustrative placeholder data and business requirements that require verification from Chandani before live commercial deployment.

## 1. Product Specifications & Pricing
- [ ] **Confirmed Prices**: Currently all products support "Request a quote" / enquiry drafts without fabricated prices. When verified catalogue pricing is ready, attach prices with currency units to `Product` model.
- [ ] **Exact Dimensions**: Current specifications indicate bespoke sizing and consultation estimates (e.g. 200 × 300 cm for rugs; scale confirmed upon enquiry for furniture). Real-world width × depth × height (mm/cm) and packaging dimensions needed.
- [ ] **Materials & Finish Specifications**: Factual yarn/fiber specifications (wool density, pile height, backing) and timber/fabric care specifics.
- [ ] **SKUs & Inventory Tracking**: Internal product SKU mapping for future ERP/backend sync.

## 2. Confirmed Category Inventory
- [ ] **Category Expansions**:
  - Sofas & seating: Currently Haven sofa, Plinth side table.
  - Carpets: Frame series in Clay, Chalk, Ink.
  - Dining: Arc dining table, Line dining chair.
  - Bedroom: Rest bed, Halo table light, Form wardrobe.
  - Storage & Lighting: Extend from current 10 sample products to full inventory.
- [ ] **Variants & Swatches**: Physical swatch images, finish samples, and fabric grades for customer selection.

## 3. Business Contact Information & Showroom
- [ ] **Physical Address**: Showroom address, studio location, or appointment locations.
- [ ] **Direct Telephone & Email**: Verified customer care phone number and official contact email.
- [ ] **Opening Hours**: Real consultation / studio visitation schedule.
- [ ] **Enquiry API Endpoint**: Connection to CRM / email dispatch (Django/Node service) to replace local draft generation.

## 4. Policies & Customer Guarantees
- [ ] **Delivery Coverage & Logistics**: Delivery geographical regions, white-glove installation options, lead times for made-to-order vs in-stock items.
- [ ] **Returns & Exchanges Policy**: Policy regarding custom-ordered furniture and rugs.
- [ ] **Warranty & Craftsmanship Guarantees**: Formal warranty terms for timber frames, upholstery, and hand-knotted carpets.

## 5. Real Project Photography & Case Studies
- [ ] **Client Project Photography**: Replace concept design scenes with verified completed whole-home and interior installations.
- [ ] **Verified Client Testimonials**: Authentic customer feedback and designer attributions.

## 6. Visual Assets for Independent Room Composition
- [ ] **Matched Perspective Layers**: Transparent PNG/WebP layers photographed or rendered from identical camera angle and focal length for independent furniture swapping (see `ASSET-REQUIREMENTS.md` and `ASSET-AUDIT.json`).
- [ ] **Isolated Shadow & Occlusion Maps**: Separate contact shadows and floor reflections to composite sofas, rugs, and occasional tables dynamically.
- [ ] **Clean Empty Room Backgrounds**: Matched day and evening backdrop plates without furniture.
