
from rest_framework import serializers
from .models import StockTransaction


class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )
    sku = serializers.CharField(
        source="product.sku",
        read_only=True
    )

    class Meta:
        model = StockTransaction
        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "transaction_type",
            "quantity",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )
        return value
