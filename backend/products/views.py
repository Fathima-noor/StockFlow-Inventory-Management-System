
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        "category", "supplier"
    ).all()
    serializer_class = ProductSerializer

    filter_backends = [
        filters.SearchFilter,
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    search_fields = ["name", "sku", "category__name"]
    filterset_fields = ["category", "supplier"]
    ordering_fields = [
        "name",
        "cost_price",
        "selling_price",
        "stock_quantity",
        "created_at",
    ]
    ordering = ["name"]
