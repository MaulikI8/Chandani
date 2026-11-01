from django.db import models

class SiteSetting(models.Model):
    """Singleton site configuration for Chandani Atelier Nepal."""
    atelier_name = models.CharField(max_length=200, default="Chandani Atelier Nepal")
    atelier_name_nepali = models.CharField(max_length=200, default="चाँदनी ए atelier नेपाल")
    tagline = models.CharField(
        max_length=300,
        default="Architectural craft, contemplative spaces, and bespoke furniture crafted in the Kathmandu Valley."
    )
    phone_primary = models.CharField(max_length=50, default="+977 1 552 4890")
    phone_secondary = models.CharField(max_length=50, default="+977 980 123 4567")
    whatsapp_number = models.CharField(max_length=50, default="+9779801234567")
    email = models.EmailField(default="atelier@chandani.com.np")
    address_showroom = models.CharField(max_length=255, default="Baber Mahal Revisited, Kathmandu, Nepal")
    address_workshop = models.CharField(max_length=255, default="Patan Industrial Estate Craft Quarter, Lalitpur, Nepal")
    currency_symbol = models.CharField(max_length=10, default="रू")
    currency_code = models.CharField(max_length=10, default="NPR")
    trade_discount_percent = models.PositiveIntegerField(default=20)
    announcement_text = models.CharField(
        max_length=300,
        default="White-glove delivery across Kathmandu Valley · Himalayan hand-knotted custom rugs & bespoke woodwork"
    )

    class Meta:
        verbose_name = "Site Setting & Atelier Profile"
        verbose_name_plural = "Site Settings & Atelier Profile"

    def __str__(self):
        return f"{self.atelier_name} ({self.currency_code})"


class Category(models.Model):
    slug = models.SlugField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    nepali_name = models.CharField(max_length=100, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.slug})"


class Room(models.Model):
    slug = models.SlugField(max_length=50, primary_key=True)
    label = models.CharField(max_length=100)
    nepali_label = models.CharField(max_length=100, blank=True)
    number = models.CharField(max_length=10, default="01")
    image = models.CharField(max_length=255, default="hero-chalk-wide.webp")
    alt = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'number']

    def __str__(self):
        return f"{self.number} - {self.label}"


class Product(models.Model):
    slug = models.SlugField(max_length=50, primary_key=True)
    name = models.CharField(max_length=150)
    nepali_name = models.CharField(max_length=150, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    type = models.CharField(max_length=100)
    price_npr = models.PositiveIntegerField(default=150000, help_text="Price in Nepali Rupees (NPR / रू)")
    image = models.CharField(max_length=255)
    palette = models.CharField(max_length=150)
    text = models.TextField()
    scene = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="scene_products")
    featured = models.BooleanField(default=False)
    focus = models.CharField(max_length=20, blank=True, help_text="Crop center percentage, e.g. 50%")
    
    # Dimensions
    dim_width = models.CharField(max_length=80, blank=True, default="")
    dim_depth = models.CharField(max_length=80, blank=True, default="")
    dim_height = models.CharField(max_length=80, blank=True, default="")
    dim_seat_height = models.CharField(max_length=80, blank=True, default="")
    dim_clearance = models.CharField(max_length=80, blank=True, default="")
    dim_weight = models.CharField(max_length=80, blank=True, default="")

    materials_list = models.JSONField(default=list, blank=True)
    finish_details = models.TextField(blank=True)
    care_instructions = models.JSONField(default=list, blank=True)
    availability = models.CharField(
        max_length=200,
        default="Handcrafted to order by Kathmandu artisans · 4–6 weeks"
    )
    delivery_info = models.TextField(
        default="White-glove delivery in Kathmandu Valley · International crating available"
    )
    related_products = models.ManyToManyField("self", blank=True, symmetrical=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.name} (रू {self.price_npr:,})"


class ProductGalleryItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="gallery_items")
    src = models.CharField(max_length=255)
    label = models.CharField(max_length=100)
    alt = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"{self.product.name} - {self.label}"


class Hotspot(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="hotspots")
    x = models.PositiveIntegerField(help_text="X coordinate (0-100)%")
    y = models.PositiveIntegerField(help_text="Y coordinate (0-100)%")
    label = models.CharField(max_length=100)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="hotspots")
    
    # For custom hotspots like kitchen layouts
    custom_id = models.CharField(max_length=50, blank=True)
    custom_title = models.CharField(max_length=150, blank=True)
    custom_text = models.TextField(blank=True)
    custom_interest = models.CharField(max_length=150, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"{self.room.label}: {self.label} ({self.x}%, {self.y}%)"


class ComparisonItem(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="comparison_items")
    slug = models.SlugField(max_length=50)
    label = models.CharField(max_length=100)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    before = models.CharField(max_length=255)
    after = models.CharField(max_length=255)
    split = models.PositiveIntegerField(default=50)
    ratio = models.FloatField(default=1.5)
    with_label = models.CharField(max_length=100, default="With piece")
    without_label = models.CharField(max_length=100, default="Without piece")
    colours = models.BooleanField(default=False, help_text="Enable live carpet colourway selection")
    interest = models.CharField(max_length=150, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"{self.room.label}: {self.label}"


class CarpetVariant(models.Model):
    color_id = models.SlugField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    nepali_name = models.CharField(max_length=100, blank=True)
    color_name = models.CharField(max_length=50)
    palette = models.CharField(max_length=100)
    hex_code = models.CharField(max_length=20, default="#b4532a")
    material_description = models.TextField(default="100% Hand-spun Tibetan Highland Wool, woven in Kathmandu")
    image_day = models.CharField(max_length=255)
    image_evening = models.CharField(max_length=255, blank=True)
    price_npr = models.PositiveIntegerField(default=175000)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'color_id']

    def __str__(self):
        return f"{self.name} ({self.color_name}) - रू {self.price_npr:,}"


class Enquiry(models.Model):
    CLIENT_TYPE_CHOICES = [
        ('private', 'Private Client Consultation'),
        ('trade', 'Trade & Interior Architects (−20%)'),
        ('swatch', 'Material Swatch Box Request (Free)'),
    ]

    STATUS_CHOICES = [
        ('new', 'New Lead / Received'),
        ('contacted', 'Contacted Client'),
        ('in_progress', 'Consultation / Quoting'),
        ('fulfilled', 'Sample Box Shipped / Ordered'),
        ('closed', 'Completed & Closed'),
    ]

    client_type = models.CharField(max_length=20, choices=CLIENT_TYPE_CHOICES, default='private')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    firm_name = models.CharField(max_length=150, blank=True, help_text="Architecture / Design Firm Name")
    project_scope = models.CharField(max_length=150, blank=True)
    shipping_address = models.TextField(blank=True, help_text="Delivery address for Swatch Box")
    room_dimensions = models.CharField(max_length=100, blank=True)
    kitchen_layout = models.CharField(max_length=100, blank=True)
    interest = models.CharField(max_length=200, default="Whole home")
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Enquiries & Leads"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_client_type_display()}] {self.name} ({self.interest}) - {self.status}"
