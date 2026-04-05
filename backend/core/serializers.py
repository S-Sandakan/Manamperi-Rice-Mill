"""
DRF Serializers for Manamperi Rice Mill.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Product, Customer, Sale, SaleItem,
    PaddyPurchase, RiceBranSale, Inventory, StockMovement,
)

User = get_user_model()


# ── User ──────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'is_active', 'date_joined')
        read_only_fields = ('date_joined',)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name',
                  'last_name', 'role', 'phone')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# ── Product ───────────────────────────────────────────────────────────
class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


# ── Customer ──────────────────────────────────────────────────────────
class CustomerSerializer(serializers.ModelSerializer):
    total_purchases = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = '__all__'

    def get_total_purchases(self, obj):
        return obj.sales.count()


# ── Sale Item ─────────────────────────────────────────────────────────
class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ('id', 'product', 'product_name', 'quantity_kg',
                  'unit_price', 'subtotal')
        read_only_fields = ('subtotal',)


class SaleItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity_kg = serializers.DecimalField(max_digits=10, decimal_places=2)


# ── Sale ──────────────────────────────────────────────────────────────
class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True, default='Walk-in', allow_null=True)
    cashier = serializers.CharField(source='user.username', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )

    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ('invoice_number', 'net_amount', 'balance', 'user')


class CheckoutSerializer(serializers.Serializer):
    """Serializer for the POS checkout endpoint."""
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    items = SaleItemCreateSerializer(many=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = serializers.ChoiceField(
        choices=Sale.PaymentMethod.choices, default='cash'
    )
    cash_received = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


# ── Paddy Purchase ────────────────────────────────────────────────────
class PaddyPurchaseSerializer(serializers.ModelSerializer):
    paddy_type_display = serializers.CharField(
        source='get_paddy_type_display', read_only=True
    )

    class Meta:
        model = PaddyPurchase
        fields = '__all__'
        read_only_fields = ('total_amount', 'user')


# ── Rice Bran Sale ────────────────────────────────────────────────────
class RiceBranSaleSerializer(serializers.ModelSerializer):
    product_type_display = serializers.CharField(
        source='get_product_type_display', read_only=True
    )

    class Meta:
        model = RiceBranSale
        fields = '__all__'
        read_only_fields = ('total_amount', 'user')


# ── Inventory ─────────────────────────────────────────────────────────
class InventorySerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    item_type_display = serializers.CharField(
        source='get_item_type_display', read_only=True
    )

    class Meta:
        model = Inventory
        fields = '__all__'


# ── Stock Movement ────────────────────────────────────────────────────
class StockMovementSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source='inventory.item_name', read_only=True)
    movement_type_display = serializers.CharField(
        source='get_movement_type_display', read_only=True
    )

    class Meta:
        model = StockMovement
        fields = '__all__'
