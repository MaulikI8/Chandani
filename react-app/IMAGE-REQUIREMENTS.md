# CHANDANI: VISUAL ASSET SPECIFICATIONS & REQUIREMENTS
## Photography, Texture Scans, Video & 3D Assets for Production Deployment

This document defines the exact visual assets required to transition Chandani from the client pitch prototype into final production deployment. All current photography in this repository serves as architectural concept imagery designed to demonstrate spatial compositions and the digital showroom experience.

---

### 1. Isolated Furniture Cutouts (Transparent Alpha PNGs)
**Purpose**: Enables the Chandani Room Studio and Try the Room Tray to dynamically layer, arrange, and compose furniture pieces on interactive canvas boards with realistic contact drop-shadows.

| Asset Identifier | Piece Description | Recommended Angle & Perspective | Output Format | Target Dimensions |
| :--- | :--- | :--- | :--- | :--- |
| `haven-sofa-alpha.png` | Haven 3-Seater Sofa in Ivory Bouclé | 15° slight elevated three-quarter view, neutral frontal lighting | 24-bit PNG with transparent alpha | 2400 × 1600 px |
| `monolith-chair-alpha.png` | Monolith Lounge Chair in Solid Ash | Front-three-quarter portrait view, floor shadow preserved | 24-bit PNG with transparent alpha | 1800 × 1800 px |
| `kanso-table-alpha.png` | Kanso Coffee Table in American Walnut | 30° elevated angle showing top surface and joinery legs | 24-bit PNG with transparent alpha | 1800 × 1400 px |
| `arc-dining-table-alpha.png` | Arc Dining Table in Solid White Oak | 20° perspective showing bullnose eased edge & pedestal | 24-bit PNG with transparent alpha | 2400 × 1600 px |
| `halo-lamp-alpha.png` | Halo Table Light in Brass & Alabaster | Straight-on eye-level view with illuminated inner diffuser | 24-bit PNG with transparent alpha | 1400 × 1800 px |
| `form-wardrobe-alpha.png` | Form Credenza / Wardrobe in Walnut & Cane | Straight architectural elevation with natural cane weave | 24-bit PNG with transparent alpha | 2000 × 2400 px |

---

### 2. High-Resolution Macro Texture Scans (1:1 Ratio)
**Purpose**: Powers the Materials Explorer tactile loupe inspector, allowing clients to examine the fiber twist, grain pore structure, and hand-buffed wax finish.

| Material ID | Material Name | Texture Characteristics to Capture | Scanning Technique | Target Resolution |
| :--- | :--- | :--- | :--- | :--- |
| `tex-sisau-macro.jpg` | Solid Sisau (Indian Rosewood) | Deep interlocking auburn grain with Linseed oil sheen | PBR flatbed scanner or cross-polarized macro DSLR | 4096 × 4096 px (16-bit) |
| `tex-walnut-macro.jpg` | American Black Walnut | Subdued espresso linear grain with open-pore hardwax oil | PBR diffuse + normal + roughness maps | 4096 × 4096 px |
| `tex-boucle-macro.jpg` | Himalayan Wool Bouclé | Heavyweight textured loop pile, unbleached lanolin fleece | High-angle raking light macro showing 3D depth | 4096 × 4096 px |
| `tex-linen-macro.jpg` | Belgian Slubbed Linen | Heavy organic flax yarn with characteristic irregular slubs | Transmitted and reflected daylight illumination | 4096 × 4096 px |
| `tex-tibetan-wool-macro.jpg` | 80-Knot Tibetan Sheep Wool | Hand-spun carded yarn with stepped micro-border relief | Macro 100mm showing individual knot structure | 4096 × 4096 px |
| `tex-marble-banswara-macro.jpg`| Banswara White Marble | Satin-honed matte touch with delicate grey mineral feathering | High-DPI non-glare flatbed scan | 4096 × 4096 px |
| `tex-brass-patan-macro.jpg` | Patinated Valley Brass | Hand-brushed micro-crystalline wax finish with living patina | Metallic reflection and brush grain capture | 4096 × 4096 px |

---

### 3. Atelier Craft Cinematography (Video Loops)
**Purpose**: Immerses visitors in the authenticity of Kathmandu Valley artisans for the Atelier & Craft Story section.

| Sequence Title | Subject & Scene | Style & Camera Direction | Output Specs |
| :--- | :--- | :--- | :--- |
| `atelier-joinery-loop.mp4` | Master joiner hand-planing Sisau timber in Patan workshop | Slow-motion (60fps), warm tungsten/daylight, shallow depth of field | 4K H.264 / AV1, 8–10 seconds, seamless loop, silent |
| `atelier-weaving-loop.mp4` | Traditional high-altitude Tibetan wool loom weaving in Lalitpur | Close-up on fingers tying knots and beating the weft comb | 4K H.264 / AV1, 6–8 seconds, seamless loop, silent |
| `atelier-oil-finishing.mp4` | Hand-buffing organic beeswax and cold-pressed linseed oil onto table surface | Raking natural daylight revealing wood grain transformation | 4K H.264 / AV1, 8 seconds, seamless loop, silent |

---

### 4. 3D GLTF / USDZ Architectural Models (Optional WebGL / AR Phase)
**Purpose**: Enables 360° piece rotation and Apple QuickLook / Android SceneViewer Augmented Reality room placement directly from the product page.

| Model Name | Mesh Polygon Budget | Texture PBR Maps | File Size Limit | Features |
| :--- | :--- | :--- | :--- | :--- |
| `haven-sofa.glb` | < 45,000 tris | 2048 × 2048 (BaseColor, Normal, Roughness, AO) | < 8 MB | Accurate bouclé wrinkles and cushion drape |
| `arc-dining-table.glb` | < 25,000 tris | 2048 × 2048 (BaseColor, Normal, Roughness) | < 5 MB | Subtle chamfer bevels, authentic oak end-grain |
| `frame-rug-series.glb` | < 12,000 tris | 2048 × 2048 (BaseColor, Normal, Roughness) | < 4 MB | Displacement-mimicking normal map for 14mm pile |

---

### 5. Architectural Integrity Note
*All photographic interior scenes currently embedded within the prototype (`hero-chalk-wide.webp`, `room-clay.webp`, `room-chalk.webp`, `dining.webp`, `bedroom.webp`, `kitchen.webp`) are concept spatial studies curated to present the Chandani aesthetic, proportions, and interactive room engines. Upon commissioning, completed residential projects from Kathmandu Valley and international collector homes will replace these concept studies under dedicated client consent.*
