from rest_framework import serializers
from .models import (
    SiteSetting, Category, Room, Product, ProductGalleryItem,
    Hotspot, ComparisonItem, CarpetVariant, Enquiry
)


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['slug', 'name', 'nepali_name', 'sort_order']


class ProductGalleryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductGalleryItem
        fields = ['src', 'label', 'alt']


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='slug')
    category = serializers.CharField(source='category.slug')
    scene = serializers.CharField(source='scene.slug')
    dimensions = serializers.SerializerMethodField()
    materialsList = serializers.JSONField(source='materials_list')
    finishDetails = serializers.CharField(source='finish_details')
    careInstructions = serializers.JSONField(source='care_instructions')
    deliveryInfo = serializers.CharField(source='delivery_info')
    galleryImages = ProductGalleryItemSerializer(source='gallery_items', many=True, read_only=True)
    relatedIds = serializers.SerializerMethodField()
    priceNpr = serializers.IntegerField(source='price_npr')
    nepaliName = serializers.CharField(source='nepali_name')

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'nepaliName', 'category', 'type', 'priceNpr', 'image',
            'palette', 'text', 'scene', 'featured', 'focus',
            'dimensions', 'materialsList', 'finishDetails', 'careInstructions',
            'availability', 'deliveryInfo', 'galleryImages', 'relatedIds'
        ]

    def get_dimensions(self, obj):
        dims = {}
        if obj.dim_width: dims['width'] = obj.dim_width
        if obj.dim_depth: dims['depth'] = obj.dim_depth
        if obj.dim_height: dims['height'] = obj.dim_height
        if obj.dim_seat_height: dims['seatHeight'] = obj.dim_seat_height
        if obj.dim_clearance: dims['clearance'] = obj.dim_clearance
        if obj.dim_weight: dims['weight'] = obj.dim_weight
        return dims if dims else None

    def get_relatedIds(self, obj):
        return list(obj.related_products.values_list('slug', flat=True))


class HotspotSerializer(serializers.ModelSerializer):
    product = serializers.CharField(source='product.slug', allow_null=True)

    class Meta:
        model = Hotspot
        fields = ['x', 'y', 'label', 'product', 'custom_id', 'custom_title', 'custom_text', 'custom_interest']

    def to_representation(self, instance):
        if instance.product:
            return {
                'x': instance.x,
                'y': instance.y,
                'label': instance.label,
                'product': instance.product.slug,
            }
        return {
            'x': instance.x,
            'y': instance.y,
            'label': instance.label,
            'id': instance.custom_id or 'custom',
            'title': instance.custom_title,
            'text': instance.custom_text,
            'interest': instance.custom_interest,
        }


class RoomSerializer(serializers.ModelSerializer):
    items = HotspotSerializer(source='hotspots', many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['label', 'number', 'image', 'alt', 'items']


class ComparisonItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='slug')
    product = serializers.CharField(source='product.slug', allow_null=True, required=False)
    withLabel = serializers.CharField(source='with_label')
    withoutLabel = serializers.CharField(source='without_label')

    class Meta:
        model = ComparisonItem
        fields = ['id', 'split', 'label', 'product', 'before', 'after', 'ratio', 'withLabel', 'withoutLabel', 'colours', 'interest']


class CarpetVariantSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='color_id')
    color = serializers.CharField(source='color_name')
    priceNpr = serializers.IntegerField(source='price_npr')

    class Meta:
        model = CarpetVariant
        fields = ['id', 'name', 'color', 'palette', 'hex_code', 'material_description', 'image_day', 'image_evening', 'priceNpr']


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = [
            'id', 'client_type', 'name', 'email', 'phone', 'firm_name',
            'project_scope', 'shipping_address', 'room_dimensions',
            'kitchen_layout', 'interest', 'notes', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']
