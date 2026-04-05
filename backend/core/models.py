"""
Models for Manamperi Rice Mill POS & Management System.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


# =====================================================================
# USER MODEL
# =====================================================================
class User(AbstractUser):
    """Custom user with role-based access."""

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        STAFF = 'staff', 'Staff'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STAFF,
    )
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN



# =====================================================================
# CUSTOMER MODEL
# =====================================================================
class Customer(models.Model):
    """Rice buyer / customer."""

    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['name']

    def __str__(self):
        return self.name


# =====================================================================
# PRODUCT MODEL
# =====================================================================
class Product(models.Model):
    """Rice product available for sale."""

    class Category(models.TextChoices):
        WHITE_RICE = 'white_rice', 'White Rice'
        RED_RICE = 'red_rice', 'Red Rice'
        BASMATI = 'basmati', 'Basmati'
        SAMBA = 'samba', 'Samba'
        NADU = 'nadu', 'Nadu'
        KEERI_SAMBA = 'keeri_samba', 'Keeri Samba'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    stock_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    low_stock_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=50,
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    @property
    def is_low_stock(self):
        return self.stock_kg <= self.low_stock_threshold


# =====================================================================
# SALE MODEL
# =====================================================================
class Sale(models.Model):
    """A POS sales transaction."""

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        CREDIT = 'credit', 'Credit'

    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales',
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    cash_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales'
        ordering = ['-created_at']

    def __str__(self):
        return f"Sale #{self.invoice_number}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last = Sale.objects.order_by('-id').first()
            next_id = (last.id + 1) if last else 1
            self.invoice_number = f"INV-{next_id:06d}"
        self.net_amount = self.total_amount - self.discount
        self.balance = self.cash_received - self.net_amount
        super().save(*args, **kwargs)


# =====================================================================
# SALE ITEM MODEL
# =====================================================================
class SaleItem(models.Model):
    """Individual line item in a sale."""

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='sale_items',
    )
    quantity_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'sale_items'

    def __str__(self):
        return f"{self.product.name} x {self.quantity_kg}kg"

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity_kg * self.unit_price
        super().save(*args, **kwargs)


# =====================================================================
# PADDY PURCHASE MODEL
# =====================================================================
class PaddyPurchase(models.Model):
    """Record of paddy purchased from farmers."""

    class PaddyType(models.TextChoices):
        SAMBA = 'samba', 'Samba Paddy'
        NADU = 'nadu', 'Nadu Paddy'
        RED = 'red', 'Red Paddy'
        WHITE = 'white', 'White Paddy'
        KEERI = 'keeri', 'Keeri Paddy'
        OTHER = 'other', 'Other'

    farmer_name = models.CharField(max_length=200)
    farmer_phone = models.CharField(max_length=20, blank=True)
    paddy_type = models.CharField(
        max_length=20,
        choices=PaddyType.choices,
        default=PaddyType.OTHER,
    )
    quantity_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    moisture_level = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='paddy_purchases',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'paddy_purchases'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.farmer_name} - {self.quantity_kg}kg {self.get_paddy_type_display()}"

    def save(self, *args, **kwargs):
        self.total_amount = self.quantity_kg * self.price_per_kg
        super().save(*args, **kwargs)


# =====================================================================
# RICE BRAN / HUSK SALE MODEL
# =====================================================================
class RiceBranSale(models.Model):
    """Sale of rice bran or husk by-products."""

    class ProductType(models.TextChoices):
        BRAN = 'bran', 'Rice Bran'
        HUSK = 'husk', 'Rice Husk'

    product_type = models.CharField(
        max_length=10,
        choices=ProductType.choices,
    )
    quantity_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    buyer_name = models.CharField(max_length=200)
    buyer_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='bran_sales',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rice_bran_sales'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_product_type_display()} - {self.quantity_kg}kg to {self.buyer_name}"

    def save(self, *args, **kwargs):
        self.total_amount = self.quantity_kg * self.price_per_kg
        super().save(*args, **kwargs)


# =====================================================================
# INVENTORY MODEL
# =====================================================================
class Inventory(models.Model):
    """Tracks stock levels for paddy, rice, bran, and husk."""

    class ItemType(models.TextChoices):
        PADDY = 'paddy', 'Paddy'
        RICE = 'rice', 'Rice'
        BRAN = 'bran', 'Rice Bran'
        HUSK = 'husk', 'Rice Husk'

    item_type = models.CharField(max_length=10, choices=ItemType.choices)
    item_name = models.CharField(max_length=200)
    quantity_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    low_stock_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=100,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory'
        ordering = ['item_type', 'item_name']
        verbose_name_plural = 'Inventory'

    def __str__(self):
        return f"{self.item_name} ({self.get_item_type_display()}) — {self.quantity_kg} kg"

    @property
    def is_low_stock(self):
        return self.quantity_kg <= self.low_stock_threshold


# =====================================================================
# STOCK MOVEMENT MODEL
# =====================================================================
class StockMovement(models.Model):
    """Log of every stock addition / deduction."""

    class MovementType(models.TextChoices):
        IN = 'in', 'Stock In'
        OUT = 'out', 'Stock Out'

    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='movements',
    )
    movement_type = models.CharField(max_length=5, choices=MovementType.choices)
    quantity_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    reference = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_movement_type_display()} {self.quantity_kg}kg — {self.inventory.item_name}"
