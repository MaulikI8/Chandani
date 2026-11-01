from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    SiteSetting, Category, Room, Product, ComparisonItem, CarpetVariant, Enquiry
)
from .serializers import (
    SiteSettingSerializer, CategorySerializer, ProductSerializer,
    RoomSerializer, ComparisonItemSerializer, CarpetVariantSerializer,
    EnquirySerializer
)


class CatalogueAPIView(APIView):
    """
    Returns the complete dynamic Chandani Atelier catalogue.
    Directly compatible with the React frontend CatalogueContent interface.
    """
    def get(self, request):
        products_qs = Product.objects.all().order_by('sort_order').prefetch_related('gallery_items', 'related_products')
        rooms_qs = Room.objects.all().prefetch_related('hotspots')
        comparisons_qs = ComparisonItem.objects.all().select_related('room', 'product')
        carpets_qs = CarpetVariant.objects.all()
        settings_obj = SiteSetting.objects.first()

        # Build rooms dictionary
        rooms_dict = {}
        for r in rooms_qs:
            rooms_dict[r.slug] = RoomSerializer(r).data

        # Build comparisons dictionary
        comparisons_dict = {}
        for r in rooms_qs:
            room_items = comparisons_qs.filter(room=r)
            comparisons_dict[r.slug] = {
                'label': r.label.replace('The ', '').capitalize(),
                'items': ComparisonItemSerializer(room_items, many=True).data
            }

        return Response({
            'products': ProductSerializer(products_qs, many=True).data,
            'rooms': rooms_dict,
            'comparisons': comparisons_dict,
            'settings': SiteSettingSerializer(settings_obj).data if settings_obj else None,
            'carpets': CarpetVariantSerializer(carpets_qs, many=True).data,
        })


class ProductListAPIView(APIView):
    def get(self, request):
        category = request.query_params.get('category')
        scene = request.query_params.get('scene')
        qs = Product.objects.all()
        if category:
            qs = qs.filter(category__slug=category)
        if scene:
            qs = qs.filter(scene__slug=scene)
        serializer = ProductSerializer(qs, many=True)
        return Response(serializer.data)


class ProductDetailAPIView(APIView):
    def get(self, request, slug):
        try:
            p = Product.objects.get(slug=slug)
            return Response(ProductSerializer(p).data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


class SiteSettingAPIView(APIView):
    def get(self, request):
        setting = SiteSetting.objects.first()
        if not setting:
            setting = SiteSetting.objects.create()
        return Response(SiteSettingSerializer(setting).data)


class CarpetVariantListAPIView(APIView):
    def get(self, request):
        qs = CarpetVariant.objects.all()
        return Response(CarpetVariantSerializer(qs, many=True).data)


class EnquiryCreateAPIView(APIView):
    """
    Endpoint for submitting customer enquiries, trade applications, and swatch box requests.
    """
    def post(self, request):
        serializer = EnquirySerializer(data=request.data)
        if serializer.is_valid():
            enquiry = serializer.save()
            return Response({
                'success': True,
                'message': 'Your enquiry has been received by Chandani Atelier Nepal. Our concierge will contact you within 24 hours.',
                'enquiry': EnquirySerializer(enquiry).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
