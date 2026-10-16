
from django.db import models


class StockTransaction(models.Model):
    IN = "IN"
    OUT = "OUT"

    TRANSACTION_TYPES = [
        (IN, "Stock In"),
        (OUT, "Stock Out"),
    ]

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=3,
        choices=TRANSACTION_TYPES,
    )
    quantity = models.PositiveIntegerField()
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.transaction_type} - {self.quantity}"
        )
