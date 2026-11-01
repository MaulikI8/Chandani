from django.contrib import admin
from django.utils.html import format_html
from .models import (
    SiteSetting, Category, Room, Product, ProductGalleryItem,
    Hotspot, ComparisonItem, CarpetVariant, Enquiry
)

# Custom Brand Headers for Nepali Atelier
admin.site.site_header = "चाँदनी | Chandani Atelier Nepal | Admin Portal"
admin.site.site_title = "Chandani Atelier Management"
admin.site.index_title = "Live Atelier Control Center & Catalogue Management"


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ['atelier_name', 'phone_primary', 'whatsapp_number', 'email', 'currency_code', 'currency_symbol', 'trade_discount_percent']
    fieldsets = (
        ("Atelier Identity (Nepal)", {
            "fields": ("atelier_name", "atelier_name_nepali", "tagline", "announcement_text")
        }),
        ("Contact & Showrooms", {
            "fields": ("phone_primary", "phone_secondary", "whatsapp_number", "email", "address_showroom", "address_workshop")
        }),
        ("Commerce & Currency Settings", {
            "fields": ("currency_code", "currency_symbol", "trade_discount_percent")
        }),
    )

    def has_add_permission(self, request):
        # Enforce singleton
        return not SiteSetting.objects.exists()


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'nepali_name', 'slug', 'sort_order', 'product_count']
    list_editable = ['sort_order']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'nepali_name', 'slug']

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Products"


class ProductGalleryItemInline(admin.TabularInline):
    model = ProductGalleryItem
    extra = 1
    fields = ['src', 'label', 'alt', 'sort_order']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'nepali_name', 'category', 'price_display', 'palette', 'scene', 'featured', 'sort_order']
    list_filter = ['category', 'scene', 'featured']
    list_editable = ['featured', 'sort_order']
    search_fields = ['name', 'nepali_name', 'palette', 'text', 'slug']
    filter_horizontal = ['related_products']
    inlines = [ProductGalleryItemInline]

    fieldsets = (
        ("Basic Information", {
            "fields": ("slug", "name", "nepali_name", "category", "type", "price_npr", "featured", "sort_order")
        }),
        ("Visuals & Context", {
            "fields": ("image", "palette", "scene", "focus")
        }),
        ("Editorial Narrative", {
            "fields": ("text",)
        }),
        ("Dimensions (Metric & Imperial)", {
            "fields": ("dim_width", "dim_depth", "dim_height", "dim_seat_height", "dim_clearance", "dim_weight")
        }),
        ("Materials & Craftsmanship", {
            "fields": ("materials_list", "finish_details", "care_instructions")
        }),
        ("Availability & Fulfillment", {
            "fields": ("availability", "delivery_info", "related_products")
        }),
    )

    def price_display(self, obj):
        return f"रू {obj.price_npr:,}"
    price_display.short_description = "Price (NPR)"


class HotspotInline(admin.TabularInline):
    model = Hotspot
    extra = 1
    fields = ['label', 'x', 'y', 'product', 'custom_title', 'custom_interest', 'sort_order']


class ComparisonItemInline(admin.StackedInline):
    model = ComparisonItem
    extra = 1
    fields = [('slug', 'label'), ('before', 'after'), ('with_label', 'without_label'), ('split', 'ratio', 'colours'), 'interest']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['number', 'label', 'nepali_label', 'slug', 'sort_order', 'hotspots_count']
    list_editable = ['sort_order']
    search_fields = ['label', 'nepali_label', 'slug']
    inlines = [HotspotInline, ComparisonItemInline]

    def hotspots_count(self, obj):
        return obj.hotspots.count()
    hotspots_count.short_description = "Hotspots"


@admin.register(CarpetVariant)
class CarpetVariantAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_name', 'palette', 'swatch_preview', 'price_display', 'sort_order']
    list_editable = ['sort_order']
    search_fields = ['name', 'color_name', 'palette']

    def swatch_preview(self, obj):
        return format_html(
            '<div style="width:24px;height:24px;background-color:{};border-radius:50%;border:1px solid #999;display:inline-block;vertical-align:middle;margin-right:8px;"></div>{}',
            obj.hex_code, obj.hex_code
        )
    swatch_preview.short_description = "Swatch Color"

    def price_display(self, obj):
        return f"रू {obj.price_npr:,}"
    price_display.short_description = "Price (NPR)"


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'name', 'client_type_badge', 'interest', 'email', 'phone', 'status_badge']
    list_filter = ['client_type', 'status', 'created_at']
    search_fields = ['name', 'email', 'phone', 'firm_name', 'interest', 'shipping_address', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 25

    fieldsets = (
        ("Client & Classification", {
            "fields": ("client_type", "status", "created_at", "updated_at")
        }),
        ("Contact Details", {
            "fields": ("name", "email", "phone")
        }),
        ("B2B Trade & Professional Credentials", {
            "fields": ("firm_name", "project_scope")
        }),
        ("Physical Swatch Box Logistics", {
            "fields": ("shipping_address",)
        }),
        ("Project Inquiries & Preferences", {
            "fields": ("interest", "room_dimensions", "kitchen_layout", "notes")
        }),
    )

    actions = ['mark_contacted', 'mark_in_progress', 'mark_fulfilled', 'mark_closed']

    def client_type_badge(self, obj):
        colors = {
            'private': '#2b6cb0',
            'trade': '#b4532a',
            'swatch': '#2f855a',
        }
        color = colors.get(obj.client_type, '#4a5568')
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            color, obj.get_client_type_display()
        )
    client_type_badge.short_description = "Tier"

    def status_badge(self, obj):
        bg = {
            'new': '#e53e3e',
            'contacted': '#dd6b20',
            'in_progress': '#3182ce',
            'fulfilled': '#805ad5',
            'closed': '#38a169',
        }.get(obj.status, '#718096')
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            bg, obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def mark_contacted(self, request, queryset):
        queryset.update(status='contacted')
    mark_contacted.short_description = "Mark selected as Contacted"

    def mark_in_progress(self, request, queryset):
        queryset.update(status='in_progress')
    mark_in_progress.short_description = "Mark selected as In Consultation / Quoting"

    def mark_fulfilled(self, request, queryset):
        queryset.update(status='fulfilled')
    mark_fulfilled.short_description = "Mark selected as Swatch Box Shipped / Ordered"

    def mark_closed(self, request, queryset):
        queryset.update(status='closed')
    mark_closed.short_description = "Mark selected as Completed & Closed"
