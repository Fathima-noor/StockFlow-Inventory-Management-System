
from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    supplier_name = serializers.CharField(
        source="supplier.name",
        read_only=True,
        default=None,
    )
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_name",
            "supplier",
            "supplier_name",
            "description",
            "cost_price",
            "selling_price",
            "stock_quantity",
            "reorder_level",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "stock_quantity",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        cost = data.get(
            "cost_price",
            getattr(self.instance, "cost_price", None),
        )
        selling = data.get(
            "selling_price",
            getattr(self.instance, "selling_price", None),
        )

        if cost is not None and cost < 0:
            raise serializers.ValidationError(
                {"cost_price": "Cost price cannot be negative."}
            )

        if selling is not None and selling < 0:
            raise serializers.ValidationError(
                {"selling_price": "Selling price cannot be negative."}
            )

        return data
