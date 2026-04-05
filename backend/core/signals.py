"""
Django signals for automatic stock management.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SaleItem, PaddyPurchase, RiceBranSale, Inventory, StockMovement


def _get_or_create_inventory(item_type, item_name):
    """Get or create an inventory record."""
    inv, _ = Inventory.objects.get_or_create(
        item_type=item_type,
        item_name=item_name,
        defaults={'quantity_kg': 0}
    )
    return inv


def _log_movement(inventory, movement_type, quantity, reference=''):
    """Create a stock movement log entry."""
    StockMovement.objects.create(
        inventory=inventory,
        movement_type=movement_type,
        quantity_kg=quantity,
        reference=reference,
    )


@receiver(post_save, sender=SaleItem)
def deduct_stock_on_sale(sender, instance, created, **kwargs):
    """Deduct product stock when a sale item is created."""
    if created:
        product = instance.product
        product.stock_kg -= instance.quantity_kg
        product.save(update_fields=['stock_kg'])

        # Update rice inventory
        inv = _get_or_create_inventory('rice', product.name)
        inv.quantity_kg -= instance.quantity_kg
        inv.save(update_fields=['quantity_kg', 'updated_at'])

        _log_movement(
            inv, 'out', instance.quantity_kg,
            reference=f"Sale #{instance.sale.invoice_number}"
        )


@receiver(post_save, sender=PaddyPurchase)
def add_paddy_stock_on_purchase(sender, instance, created, **kwargs):
    """Add paddy stock when a purchase is recorded."""
    if created:
        inv = _get_or_create_inventory(
            'paddy', f"{instance.get_paddy_type_display()}"
        )
        inv.quantity_kg += instance.quantity_kg
        inv.save(update_fields=['quantity_kg', 'updated_at'])

        _log_movement(
            inv, 'in', instance.quantity_kg,
            reference=f"Purchase from {instance.farmer_name}"
        )


@receiver(post_save, sender=RiceBranSale)
def deduct_bran_stock_on_sale(sender, instance, created, **kwargs):
    """Deduct bran/husk stock when sold."""
    if created:
        item_type = instance.product_type  # 'bran' or 'husk'
        inv = _get_or_create_inventory(
            item_type, instance.get_product_type_display()
        )
        inv.quantity_kg -= instance.quantity_kg
        inv.save(update_fields=['quantity_kg', 'updated_at'])

        _log_movement(
            inv, 'out', instance.quantity_kg,
            reference=f"Sold to {instance.buyer_name}"
        )
