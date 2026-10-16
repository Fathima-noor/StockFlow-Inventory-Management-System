
from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "sku",
        "category",
        "stock_quantity",
        "reorder_level",
        "cost_price",
    )
    search_fields = ("name", "sku")
    list_filter = ("category",)
