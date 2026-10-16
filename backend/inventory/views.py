
from django.db import transaction
from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from products.models import Product
from .models import StockTransaction
from .serializers import StockTransactionSerializer


class StockTransactionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = StockTransaction.objects.select_related("product").all()
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def perform_create(self, serializer):
        # Get the selected product
        product_id = serializer.validated_data["product"].pk

        # Lock the product row to avoid simultaneous stock updates
        product = Product.objects.select_for_update().get(
            pk=product_id
        )

        transaction_type = serializer.validated_data["transaction_type"]
        quantity = serializer.validated_data["quantity"]

        # Stock In
        if transaction_type == StockTransaction.IN:
            product.stock_quantity += quantity

        # Stock Out
        elif transaction_type == StockTransaction.OUT:
            if product.stock_quantity < quantity:
                raise ValidationError({
                    "quantity": "Insufficient stock available."
                })

            product.stock_quantity -= quantity

        else:
            raise ValidationError({
                "transaction_type": "Choose IN or OUT."
            })

        # Save the updated stock quantity
        product.save(
            update_fields=["stock_quantity", "updated_at"]
        )

        # Create the stock transaction record
        serializer.save(product=product)
