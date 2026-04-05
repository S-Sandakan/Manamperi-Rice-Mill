"""
Django Admin configuration for Manamperi Rice Mill.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Product, Customer, Sale, SaleItem,
    PaddyPurchase, RiceBranSale, Inventory, StockMovement,
)


# ── User ──────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Rice Mill Info', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Rice Mill Info', {'fields': ('role', 'phone')}),
    )


# ── Product ───────────────────────────────────────────────────────────
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price_per_kg', 'stock_kg', 'is_low_stock', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)
    list_editable = ('price_per_kg', 'is_active')


# ── Customer ──────────────────────────────────────────────────────────
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'created_at')
    search_fields = ('name', 'phone')


# ── Sale ──────────────────────────────────────────────────────────────
class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('subtotal',)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'net_amount', 'payment_method', 'created_at')
    list_filter = ('payment_method', 'created_at')
    search_fields = ('invoice_number',)
    readonly_fields = ('invoice_number', 'net_amount', 'balance')
    inlines = [SaleItemInline]


# ── Paddy Purchase ────────────────────────────────────────────────────
@admin.register(PaddyPurchase)
class PaddyPurchaseAdmin(admin.ModelAdmin):
    list_display = ('farmer_name', 'paddy_type', 'quantity_kg', 'price_per_kg', 'total_amount', 'created_at')
    list_filter = ('paddy_type', 'created_at')
    search_fields = ('farmer_name',)
    readonly_fields = ('total_amount',)


# ── Rice Bran Sale ────────────────────────────────────────────────────
@admin.register(RiceBranSale)
class RiceBranSaleAdmin(admin.ModelAdmin):
    list_display = ('product_type', 'quantity_kg', 'price_per_kg', 'total_amount', 'buyer_name', 'created_at')
    list_filter = ('product_type', 'created_at')
    search_fields = ('buyer_name',)
    readonly_fields = ('total_amount',)


# ── Inventory ─────────────────────────────────────────────────────────
@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('item_name', 'item_type', 'quantity_kg', 'low_stock_threshold', 'is_low_stock')
    list_filter = ('item_type',)
    search_fields = ('item_name',)


# ── Stock Movement ────────────────────────────────────────────────────
@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('inventory', 'movement_type', 'quantity_kg', 'reference', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('reference', 'inventory__item_name')


# ── Admin Site Customization ──────────────────────────────────────────
admin.site.site_header = 'Manamperi Rice Mill — Admin'
admin.site.site_title = 'Manamperi Rice Mill'
admin.site.index_title = 'Management Dashboard'
