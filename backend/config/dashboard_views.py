
from decimal import Decimal

from django.db.models import Count, Sum, F, DecimalField
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from categories.models import Category
from products.models import Product
from suppliers.models import Supplier
from inventory.models import StockTransaction


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        product_summary = Product.objects.aggregate(
            total_products=Count("id"),
            total_stock=Sum("stock_quantity"),
            stock_value=Sum(
                F("stock_quantity") * F("cost_price"),
                output_field=DecimalField(
                    max_digits=20,
                    decimal_places=2,
                ),
            ),
        )

        return Response({
            "total_products": product_summary["total_products"] or 0,
            "total_categories": Category.objects.count(),
            "total_suppliers": Supplier.objects.count(),
            "total_stock": product_summary["total_stock"] or 0,
            "low_stock_count": Product.objects.filter(
                stock_quantity__lte=F("reorder_level")
            ).count(),
            "stock_value": str(
                product_summary["stock_value"] or Decimal("0.00")
            ),
            "total_transactions": StockTransaction.objects.count(),
        })
