from django.urls import path
from .views import (
    CatalogueAPIView, ProductListAPIView, ProductDetailAPIView,
    SiteSettingAPIView, CarpetVariantListAPIView, EnquiryCreateAPIView
)

urlpatterns = [
    path('catalogue/', CatalogueAPIView.as_view(), name='api-catalogue'),
    path('products/', ProductListAPIView.as_view(), name='api-products'),
    path('products/<slug:slug>/', ProductDetailAPIView.as_view(), name='api-product-detail'),
    path('carpets/', CarpetVariantListAPIView.as_view(), name='api-carpets'),
    path('settings/', SiteSettingAPIView.as_view(), name='api-settings'),
    path('enquiries/', EnquiryCreateAPIView.as_view(), name='api-enquiry-create'),
]
