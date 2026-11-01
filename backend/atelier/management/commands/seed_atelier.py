from django.core.management.base import BaseCommand
from atelier.models import (
    SiteSetting, Category, Room, Product, ProductGalleryItem,
    Hotspot, ComparisonItem, CarpetVariant, Enquiry
)


class Command(BaseCommand):
    help = "Seeds Chandani Atelier Nepal dynamic database with products, rooms, carpets, settings, and leads."

    def handle(self, *args, **options):
        self.stdout.write("Seeding Chandani Atelier Nepal dynamic database...")

        # 1. Site Settings
        setting, _ = SiteSetting.objects.update_or_create(
            id=1,
            defaults={
                'atelier_name': "Chandani Atelier Nepal",
                'atelier_name_nepali': "चाँदनी ए atelier नेपाल",
                'tagline': "Architectural craft, contemplative spaces, and bespoke furniture crafted in the Kathmandu Valley.",
                'phone_primary': "+977 1 552 4890",
                'phone_secondary': "+977 980 123 4567",
                'whatsapp_number': "+9779801234567",
                'email': "atelier@chandani.com.np",
                'address_showroom': "Baber Mahal Revisited, Kathmandu, Nepal",
                'address_workshop': "Patan Industrial Estate Craft Quarter, Lalitpur, Nepal",
                'currency_symbol': "रू",
                'currency_code': "NPR",
                'trade_discount_percent': 20,
                'announcement_text': "White-glove delivery across Kathmandu Valley · Himalayan hand-knotted custom rugs & bespoke woodwork",
            }
        )
        self.stdout.write(f"✓ Site Setting configured: {setting.atelier_name}")

        # 2. Categories
        categories_data = [
            ('seating', 'Sofas & Seating', 'बस्ने कोठा र सोफा', 1),
            ('carpets', 'Hand-Knotted Carpets', 'हस्तनिर्मित गलैँचा', 2),
            ('dining', 'Dining Tables & Chairs', 'भोजन कक्ष', 3),
            ('bedroom', 'Beds & Bedside', 'सुत्ने कोठा', 4),
            ('lighting', 'Lighting & Décor', 'बत्ती र सजावट', 5),
            ('storage', 'Wardrobes & Cabinetry', 'दराज र भण्डारण', 6),
        ]
        cat_objs = {}
        for slug, name, nep_name, sort_order in categories_data:
            c, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={'name': name, 'nepali_name': nep_name, 'sort_order': sort_order}
            )
            cat_objs[slug] = c
        self.stdout.write(f"✓ {len(cat_objs)} Categories created.")

        # 3. Rooms
        rooms_data = [
            ('living', 'The living room', 'बैठक कोठा', '01', 'hero-chalk-wide.webp', 'Living room with ivory sofa, a Chalk bordered carpet and a dark side table', 1),
            ('kitchen', 'The kitchen', 'भान्सा कोठा', '02', 'kitchen.webp', 'Kitchen concept with a walnut island, stone-style worktop and green cabinets', 2),
            ('bedroom', 'The bedroom', 'सुत्ने कोठा', '03', 'bedroom.webp', 'Bedroom concept with upholstered bed, bedside light and walnut wardrobe', 3),
            ('dining', 'The dining room', 'भोजन कक्ष', '04', 'dining.webp', 'Dining room concept with a rounded oak table and dark woven-seat chairs', 4),
        ]
        room_objs = {}
        for slug, label, nep_label, num, img, alt, sort_order in rooms_data:
            r, _ = Room.objects.update_or_create(
                slug=slug,
                defaults={
                    'label': label,
                    'nepali_label': nep_label,
                    'number': num,
                    'image': img,
                    'alt': alt,
                    'sort_order': sort_order
                }
            )
            room_objs[slug] = r
        self.stdout.write(f"✓ {len(room_objs)} Rooms created.")

        # 4. Products
        products_data = [
            {
                'slug': 'sofa',
                'name': 'Haven / Sofa',
                'nepali_name': 'हेभन सोफा',
                'category': 'seating',
                'type': 'Sofas & seating',
                'price_npr': 285000,
                'image': 'sofa.webp',
                'palette': 'Oatmeal',
                'text': 'Soft proportions and a quiet neutral palette. A comfortable starting point for a room built around everyday living.',
                'scene': 'living',
                'featured': True,
                'focus': '',
                'dim_width': '240 cm (94.5")',
                'dim_depth': '102 cm (40.2")',
                'dim_height': '76 cm (30.0")',
                'dim_seat_height': '42 cm (16.5")',
                'dim_clearance': '8 cm (3.1")',
                'dim_weight': '78 kg',
                'materials_list': [
                    'Solid kiln-dried beech and Himalayan Sisau timber internal frame with reinforced mortise-and-tenon joinery',
                    'High-resilience foam core cushioned with certified recycled down-alternative micro-feathers',
                    'Heavyweight 100% natural textured linen-cotton weave in Oatmeal with breathable protection',
                    'Recessed solid smoked-oak low plinth base',
                ],
                'finish_details': 'Textured Oatmeal linen blend with matte smoked oak plinth.',
                'care_instructions': [
                    'Vacuum regularly using a low-suction setting and a clean, soft upholstery brush.',
                    'Rotate and plump seat and back cushions weekly to maintain shape and even feather distribution.',
                    'Blot spills immediately with a clean, dry undyed cloth; avoid vigorous rubbing.',
                    'Professional in-situ upholstery cleaning recommended annually.',
                ],
                'availability': 'Made to order · Handcrafted in Kathmandu in 4–6 weeks',
                'delivery_info': 'Complimentary white-glove delivery in Kathmandu Valley: room placement, unboxing, and packaging recycling.',
                'gallery': [
                    ('sofa.webp', 'Studio portrait', 'Haven Sofa studio portrait in Oatmeal linen'),
                    ('hero-chalk-wide.webp', 'Living room context', 'Haven Sofa styled in the Chandani living room'),
                    ('without-sofa.webp', 'Room before placement', 'Living room space before sofa placement'),
                ],
            },
            {
                'slug': 'chalk',
                'name': 'Frame / Chalk',
                'nepali_name': 'फ्रेम चक गलैँचा',
                'category': 'carpets',
                'type': 'Carpets',
                'price_npr': 175000,
                'image': 'product-chalk.webp',
                'palette': 'Oatmeal / soft taupe',
                'text': 'A light, textured field with a stepped double border. A quiet foundation that connects the pieces around it.',
                'scene': 'living',
                'featured': True,
                'focus': '',
                'dim_width': '300 cm (118.1")',
                'dim_depth': '240 cm (94.5")',
                'dim_height': '1.4 cm pile height',
                'dim_seat_height': '',
                'dim_clearance': '',
                'dim_weight': '30 kg',
                'materials_list': [
                    '100% hand-spun Tibetan highland and New Zealand semi-worsted wool for natural stain resistance',
                    'Organic unbleached cotton warp and double-weft backing woven by master Kathmandu valley weavers',
                    'Hand-tufted loop and cut pile combination creating micro-relief shadow lines',
                ],
                'finish_details': 'Textured chalk-oatmeal field with soft taupe stepped border.',
                'care_instructions': [
                    'Vacuum regularly with suction only; avoid rotary beater bars.',
                    'Rotate 180 degrees once a year to balance natural sunlight and foot traffic.',
                    'Blot damp spills with clean absorbent towel; do not scrub.',
                    'Professional specialist wool rug wash recommended every 2 years.',
                ],
                'availability': 'In stock in Kathmandu gallery · Dispatches in 3–5 business days (Custom sizing available)',
                'delivery_info': 'Specialist rug delivery with unrolling, natural underlay installation, and packaging removal.',
                'gallery': [
                    ('product-chalk.webp', 'Weave flat lay', 'Frame Chalk carpet detail and border texture'),
                    ('room-chalk.webp', 'Room context', 'Frame Chalk carpet in styled living room'),
                    ('room-empty.webp', 'Bare oak floor', 'Bare oak floor without carpet'),
                ],
            },
            {
                'slug': 'dining-table',
                'name': 'Arc / Dining table',
                'nepali_name': 'आर्क डाइनिङ टेबल',
                'category': 'dining',
                'type': 'Dining',
                'price_npr': 220000,
                'image': 'without-dining-chairs.webp',
                'palette': 'Natural oak tone',
                'text': 'Rounded edges and a generous tabletop. A design direction for everyday meals and the gatherings that run a little longer.',
                'scene': 'dining',
                'featured': True,
                'focus': '50%',
                'dim_width': '240 cm (94.5")',
                'dim_depth': '100 cm (39.4")',
                'dim_height': '75 cm (29.5")',
                'dim_seat_height': '',
                'dim_clearance': '71 cm (28.0")',
                'dim_weight': '92 kg',
                'materials_list': [
                    'Solid sustainably sourced white oak and seasoned Himalayan timber',
                    'Integrated underside steel tension rods allowing natural timber expansion without cupping',
                    'Hand-shaped bullnose radius corners sculpted by Patan woodcarving masters',
                ],
                'finish_details': 'Ultra-matte breathable organic hardwax-oil preserving raw grain texture.',
                'care_instructions': [
                    'Wipe down with a damp lint-free cloth; dry immediately with a clean microfiber towel.',
                    'Use placemats or trivets for hot plates and chilled carafes.',
                    'Avoid chemical cleaners, alcohol, and acidic substances.',
                    'Re-apply Chandani organic maintenance wax oil once every 12–18 months.',
                ],
                'availability': 'Handcrafted to order · 4–5 weeks in Patan workshop',
                'delivery_info': 'Two-person white-glove delivery, dining room positioning, leg bolting, and packaging haul-away.',
                'gallery': [
                    ('without-dining-chairs.webp', 'Dining table portrait', 'Arc Dining table crafted in solid white oak'),
                    ('dining.webp', 'Dining room in situ', 'Arc Dining table with chairs in dining room'),
                    ('without-dining-table.webp', 'Space without table', 'Dining room before dining table installation'),
                ],
            },
            {
                'slug': 'bed',
                'name': 'Rest / Upholstered bed',
                'nepali_name': 'रेस्ट बेड',
                'category': 'bedroom',
                'type': 'Bedroom',
                'price_npr': 310000,
                'image': 'bedroom.webp',
                'palette': 'Walnut / oatmeal',
                'text': 'A low timber frame and soft upholstered headboard. A warm, grounded starting point for your bedroom.',
                'scene': 'bedroom',
                'featured': True,
                'focus': '63%',
                'dim_width': '192 cm (75.6" King)',
                'dim_depth': '224 cm (88.2")',
                'dim_height': '108 cm headboard (42.5")',
                'dim_seat_height': '',
                'dim_clearance': '18 cm (7.1")',
                'dim_weight': '110 kg',
                'materials_list': [
                    'Solid black walnut perimeter frame with hand-sanded eased edges',
                    'Individually sprung curved wood slats with central lumbar tension adjusters',
                    'Belgian linen-blend upholstered headboard padded with hypoallergenic natural wool fleece',
                ],
                'finish_details': 'Satin-rubbed natural walnut oil with textured Oatmeal wool-linen headboard.',
                'care_instructions': [
                    'Vacuum headboard quarterly using a gentle upholstery attachment.',
                    'Dust walnut perimeter with a soft dry cotton cloth.',
                    'Check and tighten hidden corner joinery fixings annually.',
                ],
                'availability': 'Handcrafted to order · 5–6 weeks',
                'delivery_info': 'Complete white-glove bedroom installation: frame build, slat setup, and packaging removal.',
                'gallery': [
                    ('bedroom.webp', 'Bedroom context', 'Rest Upholstered bed in bedroom'),
                    ('without-bed.webp', 'Room before bed', 'Bedroom space before bed placement'),
                ],
            },
            {
                'slug': 'clay',
                'name': 'Frame / Clay',
                'nepali_name': 'फ्रेम क्ले गलैँचा',
                'category': 'carpets',
                'type': 'Carpets',
                'price_npr': 175000,
                'image': 'product-clay.webp',
                'palette': 'Terracotta / dark earth',
                'text': 'A warm terracotta field with a fine dark border. Clay adds colour and a stronger focal point to the room.',
                'scene': 'living',
                'featured': False,
                'focus': '',
                'dim_width': '300 cm (118.1")',
                'dim_depth': '240 cm (94.5")',
                'dim_height': '1.4 cm pile height',
                'dim_seat_height': '',
                'dim_clearance': '',
                'dim_weight': '30 kg',
                'materials_list': [
                    '100% hand-spun Tibetan highland wool dyed with mineral-rich terracotta pigments',
                    'Heavy organic cotton base weave with bound micro-stitched selvedges',
                    'Cut and loop texture offering acoustic warmth and underfoot density',
                ],
                'finish_details': 'Terracotta earth center with fine ebonized dark earth border.',
                'care_instructions': [
                    'Suction-only vacuuming once to twice weekly.',
                    'Treat stains promptly with clean water and mild pH-neutral wool detergent.',
                    'Avoid high-moisture carpet shampoos.',
                ],
                'availability': 'Small batch production in Lalitpur · Ready in 1–2 weeks',
                'delivery_info': 'White-glove courier delivery with precision unrolling and non-skid underlay setup.',
                'gallery': [
                    ('product-clay.webp', 'Flat lay view', 'Frame Clay carpet texture and border'),
                    ('room-clay.webp', 'Room context', 'Frame Clay carpet in styled living room'),
                    ('room-empty.webp', 'Bare floor', 'Living room with bare floor'),
                ],
            },
            {
                'slug': 'ink',
                'name': 'Frame / Ink',
                'nepali_name': 'फ्रेम इङ्क गलैँचा',
                'category': 'carpets',
                'type': 'Carpets',
                'price_npr': 175000,
                'image': 'product-ink.webp',
                'palette': 'Charcoal / warm ivory',
                'text': 'A deep charcoal field and warm ivory border. A graphic foundation for light upholstery and natural wood.',
                'scene': 'living',
                'featured': False,
                'focus': '',
                'dim_width': '300 cm (118.1")',
                'dim_depth': '240 cm (94.5")',
                'dim_height': '1.4 cm pile height',
                'dim_seat_height': '',
                'dim_clearance': '',
                'dim_weight': '30 kg',
                'materials_list': [
                    '100% premium long-staple Tibetan highland wool, naturally flame retardant and soil resistant',
                    'Hand-woven double-warp cotton foundation for dimensional stability',
                    'Deep charcoal saturated dye with natural unbleached ivory border yarns',
                ],
                'finish_details': 'Charcoal ink field with stepped ivory framing border.',
                'care_instructions': [
                    'Vacuum with suction nozzle; rotate position every six months.',
                    'Dab liquid spills with an undyed absorbent cloth immediately.',
                    'Professional rug cleaning every 2 years.',
                ],
                'availability': 'In stock in Kathmandu gallery · Dispatches in 3–5 business days',
                'delivery_info': 'Direct white-glove room placement with protective felt underpad included.',
                'gallery': [
                    ('product-ink.webp', 'Flat lay view', 'Frame Ink carpet weave and ivory border'),
                    ('room-ink.webp', 'Room context', 'Frame Ink carpet in styled living room'),
                    ('room-empty.webp', 'Bare floor', 'Living room before rug placement'),
                ],
            },
            {
                'slug': 'side-table',
                'name': 'Plinth / Side table',
                'nepali_name': 'प्लिन्थ साइड टेबल',
                'category': 'seating',
                'type': 'Occasional furniture',
                'price_npr': 48000,
                'image': 'hero-chalk-wide.webp',
                'palette': 'Dark timber tone',
                'text': 'A small sculptural accent beside the sofa. A place for a book, a cup or a favourite object.',
                'scene': 'living',
                'featured': False,
                'focus': '40%',
                'dim_width': '46 cm diameter (18.1")',
                'dim_depth': '46 cm (18.1")',
                'dim_height': '50 cm (19.7")',
                'dim_seat_height': '',
                'dim_clearance': '',
                'dim_weight': '18 kg',
                'materials_list': [
                    'Turned solid oak monolith core weighted with an integrated lower steel stabilizing disc',
                    'Subtle multifaceted cylindrical silhouette hand-sculpted in Patan',
                ],
                'finish_details': 'Ebonized dark timber stain with velvety protective low-gloss lacquer.',
                'care_instructions': [
                    'Dust with a dry or lightly dampened microfiber cloth.',
                    'Use coasters for beverages to prevent moisture ring marks.',
                ],
                'availability': 'In stock · Dispatches in 2–3 business days',
                'delivery_info': 'Protective carton courier delivery placed in your room of choice.',
                'gallery': [
                    ('hero-chalk-wide.webp', 'Living room placement', 'Plinth Side table beside Haven Sofa'),
                    ('without-side-table.webp', 'Room without table', 'Living room without side table'),
                ],
            },
            {
                'slug': 'dining-chair',
                'name': 'Line / Dining chair',
                'nepali_name': 'लाइन डाइनिङ कुर्सी',
                'category': 'dining',
                'type': 'Dining',
                'price_npr': 38000,
                'image': 'dining.webp',
                'palette': 'Dark timber / woven seat',
                'text': 'A curved back and a woven-seat direction that brings texture to the table.',
                'scene': 'dining',
                'featured': False,
                'focus': '52%',
                'dim_width': '54 cm (21.3")',
                'dim_depth': '52 cm (20.5")',
                'dim_height': '78 cm (30.7")',
                'dim_seat_height': '46 cm (18.1")',
                'dim_clearance': '',
                'dim_weight': '6.8 kg',
                'materials_list': [
                    'Steam-bent solid hardwood frame with mortise-and-tenon wood pinned joinery',
                    'Hand-woven 3-ply natural paper cord seat crafted by expert Kathmandu artisans',
                    'Subtle ergonomic curved lumbar support rail',
                ],
                'finish_details': 'Smoked ebonized timber stain with unbleached natural cord.',
                'care_instructions': [
                    'Gently vacuum cord seat with brush attachment to remove dust.',
                    'Blot stains immediately with a damp white towel.',
                ],
                'availability': 'Sets in stock in showroom · Dispatches in 3–5 days',
                'delivery_info': 'Delivered fully assembled in custom reusable cotton dust sleeves.',
                'gallery': [
                    ('dining.webp', 'Dining room in situ', 'Line dining chairs around dining table'),
                    ('without-dining-chairs.webp', 'Table without chairs', 'Dining room without chairs'),
                ],
            },
            {
                'slug': 'lamp',
                'name': 'Halo / Table light',
                'nepali_name': 'हेलो टेबल लाइट',
                'category': 'lighting',
                'type': 'Lighting & décor',
                'price_npr': 26000,
                'image': 'bedroom.webp',
                'palette': 'Paper shade / warm timber',
                'text': 'A softly rounded light for the bedside or a quiet corner. Handcrafted Nepali lokta paper and turned walnut.',
                'scene': 'bedroom',
                'featured': False,
                'focus': '0%',
                'dim_width': '32 cm diameter (12.6")',
                'dim_depth': '32 cm (12.6")',
                'dim_height': '42 cm (16.5")',
                'dim_seat_height': '',
                'dim_clearance': '220 cm cord length',
                'dim_weight': '3.4 kg',
                'materials_list': [
                    'Traditional handmade Himalayan Lokta paper shade with natural botanical fiber inclusions',
                    'Solid turned walnut plinth base',
                    'Brushed solid brass rotary dimmer and cloth-covered natural cord',
                ],
                'finish_details': 'Translucent Lokta paper with oiled walnut base and brushed brass accents.',
                'care_instructions': [
                    'Dust paper shade with soft feather duster.',
                    'Wipe timber base with dry microfiber cloth.',
                    'Use E26/E27 dimmable warm LED bulb (2700K recommended).',
                ],
                'availability': 'In stock · Dispatches in 2–4 business days',
                'delivery_info': 'Custom molded packaging via express courier.',
                'gallery': [
                    ('bedroom.webp', 'Bedside context', 'Halo table light on bedroom bedside'),
                    ('without-lamp.webp', 'Room without light', 'Bedroom space before lamp placement'),
                ],
            },
            {
                'slug': 'wardrobe',
                'name': 'Form / Wardrobe',
                'nepali_name': 'फर्म वार्डरोब',
                'category': 'storage',
                'type': 'Storage',
                'price_npr': 395000,
                'image': 'bedroom.webp',
                'palette': 'Warm walnut tone',
                'text': 'Simple vertical lines and a warm timber palette. A starting point for thinking through storage in your space.',
                'scene': 'bedroom',
                'featured': False,
                'focus': '100%',
                'dim_width': '120 cm single bay / 240 cm double suite (94.5")',
                'dim_depth': '62 cm (24.4")',
                'dim_height': '220 cm (86.6")',
                'dim_seat_height': '',
                'dim_clearance': '',
                'dim_weight': '145 kg',
                'materials_list': [
                    'Solid American black walnut frame and reeded acoustic door fronts',
                    'Aromatic solid cedar drawer interiors (naturally moth and moisture repellent in Kathmandu climate)',
                    'Blum soft-close concealed hinges and integrated warm LED hanging rail',
                ],
                'finish_details': 'Warm walnut tone with tactile vertical fluting and recessed brass edge pulls.',
                'care_instructions': [
                    'Wipe exterior along the grain with a slightly damp cloth, then buff dry.',
                    'Lightly sand interior cedar every 2 years to refresh natural aroma.',
                ],
                'availability': 'Custom modular build · Handcrafted in Patan in 6–8 weeks',
                'delivery_info': 'Specialist installation team delivers, anchors to wall, aligns doors, and vacuums interior.',
                'gallery': [
                    ('bedroom.webp', 'Bedroom context', 'Form wardrobe in styled bedroom suite'),
                    ('without-wardrobe.webp', 'Room without wardrobe', 'Bedroom space before wardrobe installation'),
                ],
            },
        ]

        product_objs = {}
        for p_idx, pdata in enumerate(products_data, start=1):
            gallery = pdata.pop('gallery')
            category_slug = pdata.pop('category')
            scene_slug = pdata.pop('scene')

            p, _ = Product.objects.update_or_create(
                slug=pdata['slug'],
                defaults={
                    **pdata,
                    'category': cat_objs[category_slug],
                    'scene': room_objs[scene_slug],
                    'sort_order': p_idx,
                }
            )
            product_objs[p.slug] = p

            # Gallery items
            p.gallery_items.all().delete()
            for idx, (src, lbl, alt) in enumerate(gallery):
                ProductGalleryItem.objects.create(
                    product=p,
                    src=src,
                    label=lbl,
                    alt=alt,
                    sort_order=idx
                )

        # Connect related products
        related_map = {
            'sofa': ['side-table', 'chalk'],
            'chalk': ['sofa', 'side-table'],
            'dining-table': ['dining-chair'],
            'bed': ['lamp', 'wardrobe'],
            'clay': ['sofa', 'side-table'],
            'ink': ['sofa', 'side-table'],
            'side-table': ['sofa', 'chalk'],
            'dining-chair': ['dining-table'],
            'lamp': ['bed', 'wardrobe'],
            'wardrobe': ['bed', 'lamp'],
        }
        for p_slug, rel_slugs in related_map.items():
            if p_slug in product_objs:
                p = product_objs[p_slug]
                p.related_products.set([product_objs[s] for s in rel_slugs if s in product_objs])

        self.stdout.write(f"✓ {len(product_objs)} Products created with gallery and relationships.")

        # 5. Hotspots
        Hotspot.objects.all().delete()
        # Living room
        Hotspot.objects.create(room=room_objs['living'], x=73, y=45, label='The sofa', product=product_objs['sofa'], sort_order=1)
        Hotspot.objects.create(room=room_objs['living'], x=69, y=79, label='The carpet', product=product_objs['chalk'], sort_order=2)
        Hotspot.objects.create(room=room_objs['living'], x=44, y=51, label='The side table', product=product_objs['side-table'], sort_order=3)

        # Kitchen
        Hotspot.objects.create(
            room=room_objs['kitchen'], x=62, y=65, label='The layout',
            custom_id='layout', custom_title='Room to come together.',
            custom_text='An island-led arrangement with space to prepare, share and sit. Start with the measurements and everyday routines of your own kitchen.',
            custom_interest='Kitchen design · Layout', sort_order=1
        )
        Hotspot.objects.create(
            room=room_objs['kitchen'], x=90, y=35, label='The storage',
            custom_id='storage', custom_title='A place for everything.',
            custom_text='Explore how tall cupboards, drawers and integrated storage could work together in your kitchen.',
            custom_interest='Kitchen design · Storage', sort_order=2
        )
        Hotspot.objects.create(
            room=room_objs['kitchen'], x=78, y=51, label='The finishes',
            custom_id='finishes', custom_title='Warmth, in the details.',
            custom_text='A study in walnut tones, muted green and a pale worktop. Bring the colours and materials you are drawn to.',
            custom_interest='Kitchen design · Finishes', sort_order=3
        )

        # Bedroom
        Hotspot.objects.create(room=room_objs['bedroom'], x=59, y=65, label='The bed', product=product_objs['bed'], sort_order=1)
        Hotspot.objects.create(room=room_objs['bedroom'], x=22, y=47, label='The light', product=product_objs['lamp'], sort_order=2)
        Hotspot.objects.create(room=room_objs['bedroom'], x=89, y=37, label='The wardrobe', product=product_objs['wardrobe'], sort_order=3)

        # Dining
        Hotspot.objects.create(room=room_objs['dining'], x=69, y=46, label='The table', product=product_objs['dining-table'], sort_order=1)
        Hotspot.objects.create(room=room_objs['dining'], x=51, y=74, label='The chair', product=product_objs['dining-chair'], sort_order=2)
        self.stdout.write("✓ Hotspots populated across all 4 rooms.")

        # 6. Comparison Items
        ComparisonItem.objects.all().delete()
        # Living room comparisons
        ComparisonItem.objects.create(
            room=room_objs['living'], slug='sofa', label='Sofa', product=product_objs['sofa'],
            before='without-sofa.webp', after='hero-chalk-wide.webp', split=72, ratio=1919/820,
            with_label='With sofa', without_label='Without sofa', sort_order=1
        )
        ComparisonItem.objects.create(
            room=room_objs['living'], slug='carpet', label='Carpet', product=product_objs['chalk'],
            before='room-empty.webp', after='room-chalk.webp', split=50, ratio=1.5,
            with_label='With carpet', without_label='Bare floor', colours=True, sort_order=2
        )
        ComparisonItem.objects.create(
            room=room_objs['living'], slug='side-table', label='Side table', product=product_objs['side-table'],
            before='without-side-table.webp', after='hero-chalk-wide.webp', split=46, ratio=1919/820,
            with_label='With side table', without_label='Without side table', sort_order=3
        )

        # Dining room comparisons
        ComparisonItem.objects.create(
            room=room_objs['dining'], slug='dining-table', label='Dining table', product=product_objs['dining-table'],
            before='without-dining-table.webp', after='dining.webp', split=50, ratio=2.25,
            with_label='With table', without_label='Without table', sort_order=1
        )
        ComparisonItem.objects.create(
            room=room_objs['dining'], slug='dining-chair', label='Dining chairs', product=product_objs['dining-chair'],
            before='without-dining-chairs.webp', after='dining.webp', split=50, ratio=2.25,
            with_label='With chairs', without_label='Without chairs', sort_order=2
        )

        # Bedroom comparisons
        ComparisonItem.objects.create(
            room=room_objs['bedroom'], slug='bed', label='Bed', product=product_objs['bed'],
            before='without-bed.webp', after='bedroom.webp', split=50, ratio=2.25,
            with_label='With bed', without_label='Without bed', sort_order=1
        )
        ComparisonItem.objects.create(
            room=room_objs['bedroom'], slug='lamp', label='Table light', product=product_objs['lamp'],
            before='without-lamp.webp', after='bedroom.webp', split=22, ratio=2.25,
            with_label='With light', without_label='Without light', sort_order=2
        )
        ComparisonItem.objects.create(
            room=room_objs['bedroom'], slug='wardrobe', label='Wardrobe', product=product_objs['wardrobe'],
            before='without-wardrobe.webp', after='bedroom.webp', split=88, ratio=2.25,
            with_label='With wardrobe', without_label='Without wardrobe', sort_order=3
        )

        # Kitchen comparisons
        ComparisonItem.objects.create(
            room=room_objs['kitchen'], slug='kitchen', label='Kitchen design',
            before='without-kitchen.webp', after='kitchen.webp', split=50, ratio=2.25,
            with_label='Kitchen concept', without_label='Before the design', interest='Kitchen design', sort_order=1
        )
        self.stdout.write("✓ Comparison items populated for Try in the room sliders.")

        # 7. Carpet Studio Variants
        carpet_variants = [
            ('clay', 'Frame / Clay', 'फ्रेम क्ले गलैँचा', 'Clay', 'Terracotta / dark earth', '#a06144',
             '100% Hand-spun Tibetan highland wool dyed with rich mineral terracotta washes.',
             'room-clay.webp', 'room-clay-evening.webp', 175000, 1),
            ('chalk', 'Frame / Chalk', 'फ्रेम चक गलैँचा', 'Chalk', 'Oatmeal / soft taupe', '#d5cfc5',
             '100% Hand-spun Tibetan highland wool in natural unbleached chalk and oatmeal tones.',
             'room-chalk.webp', 'room-chalk-evening.webp', 175000, 2),
            ('ink', 'Frame / Ink', 'फ्रेम इङ्क गलैँचा', 'Ink', 'Charcoal / warm ivory', '#2a3439',
             '100% Hand-spun Tibetan highland wool in saturated charcoal ink with warm ivory selvedge.',
             'room-ink.webp', 'room-ink-evening.webp', 175000, 3),
        ]
        for cid, name, nep_name, cname, pal, hex_c, desc, day, eve, pr, s_ord in carpet_variants:
            CarpetVariant.objects.update_or_create(
                color_id=cid,
                defaults={
                    'name': name,
                    'nepali_name': nep_name,
                    'color_name': cname,
                    'palette': pal,
                    'hex_code': hex_c,
                    'material_description': desc,
                    'image_day': day,
                    'image_evening': eve,
                    'price_npr': pr,
                    'sort_order': s_ord,
                }
            )
        self.stdout.write("✓ Carpet Studio variants seeded.")

        # 8. Sample Enquiries & Leads for Business Demo
        if not Enquiry.objects.exists():
            Enquiry.objects.create(
                client_type='trade',
                name='Prashant Shrestha',
                email='prashant@himalayanarchitects.com.np',
                phone='+977 98510 24890',
                firm_name='Himalayan Architectural Studio, Jhamsikhel',
                project_scope='Luxury Boutique Hotel & Private Residence (Kathmandu)',
                interest='Haven / Sofa & Frame Carpets',
                notes='Requesting 3D CAD .DWG models, finish samples, and trade tier discount pricing for 12 bedroom suites and central lounge.',
                status='in_progress',
            )
            Enquiry.objects.create(
                client_type='swatch',
                name='Sunita Pradhan',
                email='sunita.pradhan@gmail.com',
                phone='+977 98011 55678',
                shipping_address='House No. 42, Sanepa Heights, Lalitpur, Nepal',
                interest='Bespoke Living Room Swatch Box',
                notes='Please include samples of Solid White Oak, Smoked Walnut, Oatmeal Linen, and Clay Himalayan Wool.',
                status='fulfilled',
            )
            Enquiry.objects.create(
                client_type='private',
                name='Bikash Adhikari',
                email='bikash.adhikari@outlook.com',
                phone='+977 98412 34567',
                interest='Arc / Dining table',
                room_dimensions='5.2 m × 4.0 m',
                notes='Looking for a 2.4m dining table with 8 Line dining chairs for our home in Budhanilkantha.',
                status='new',
            )
            self.stdout.write("✓ Realistic demo enquiries and trade leads seeded.")

        self.stdout.write(self.style.SUCCESS("★ Chandani Atelier Nepal dynamic database successfully seeded!"))
