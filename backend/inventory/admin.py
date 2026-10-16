
from django.contrib import admin
from .models import StockTransaction


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "product",
        "transaction_type",
        "quantity",
        "created_at",
    )
    list_filter = ("transaction_type", "created_at")
    search_fields = ("product__name", "product__sku")
