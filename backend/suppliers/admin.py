
from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "contact_person", "email", "phone")
    search_fields = ("name", "contact_person", "email", "phone")
