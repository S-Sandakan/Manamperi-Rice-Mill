"""
API Views for Manamperi Rice Mill.
"""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Product, Customer, Sale, SaleItem,
    PaddyPurchase, RiceBranSale, Inventory, StockMovement,
)
from .serializers import (
    UserSerializer, UserCreateSerializer,
    ProductSerializer, CustomerSerializer,
    SaleSerializer, CheckoutSerializer,
    PaddyPurchaseSerializer, RiceBranSaleSerializer,
    InventorySerializer, StockMovementSerializer,
)
from .permissions import IsAdminUser, IsAdminOrReadOnly
from .utils import generate_invoice_pdf, generate_excel_report

from django.contrib.auth import get_user_model
User = get_user_model()


# ======================================================================
# USER
# ======================================================================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return the current logged-in user."""
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change current user's password."""
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'Both old_password and new_password are required.'}, status=400)
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=400)
        if not request.user.check_password(old_password):
            return Response({'error': 'Current password is incorrect.'}, status=400)
        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Password changed successfully.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def reset_password(self, request, pk=None):
        """Admin resets a user's password."""
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'new_password is required.'}, status=400)
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'message': f'Password for {user.username} has been reset.'})


# ======================================================================
# PRODUCT
# ======================================================================
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'price_per_kg', 'stock_kg']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """List products with stock at or below threshold."""
        products = Product.objects.filter(
            stock_kg__lte=F('low_stock_threshold'), is_active=True
        )
        return Response(ProductSerializer(products, many=True).data)


# ======================================================================
# CUSTOMER
# ======================================================================
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone']

    @action(detail=True, methods=['get'])
    def sales(self, request, pk=None):
        """Get purchase history for a customer."""
        customer = self.get_object()
        sales = customer.sales.all()
        return Response(SaleSerializer(sales, many=True).data)


# ======================================================================
# SALE  (POS)
# ======================================================================
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('customer', 'user').prefetch_related('items__product')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['payment_method']
    search_fields = ['invoice_number', 'customer__name']
    ordering_fields = ['created_at', 'net_amount']

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """
        POS Checkout — creates a Sale with SaleItems and updates stock.
        """
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validate products and stock
        items_data = data['items']
        if not items_data:
            return Response({'error': 'No items provided.'}, status=400)

        products = {}
        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'], is_active=True)
            except Product.DoesNotExist:
                return Response(
                    {'error': f"Product ID {item['product_id']} not found."},
                    status=400,
                )
            if product.stock_kg < item['quantity_kg']:
                return Response(
                    {'error': f"Insufficient stock for {product.name}. "
                              f"Available: {product.stock_kg} kg"},
                    status=400,
                )
            products[item['product_id']] = product

        # Create sale
        customer = None
        if data.get('customer_id'):
            try:
                customer = Customer.objects.get(id=data['customer_id'])
            except Customer.DoesNotExist:
                pass

        total = sum(
            products[i['product_id']].price_per_kg * i['quantity_kg']
            for i in items_data
        )

        sale = Sale.objects.create(
            customer=customer,
            user=request.user,
            total_amount=total,
            discount=data.get('discount', 0),
            payment_method=data.get('payment_method', 'cash'),
            cash_received=data.get('cash_received', 0),
            notes=data.get('notes', ''),
        )

        # Create sale items (signals auto-deduct stock)
        for item in items_data:
            product = products[item['product_id']]
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity_kg=item['quantity_kg'],
                unit_price=product.price_per_kg,
            )

        # Refresh totals
        sale.refresh_from_db()
        return Response(SaleSerializer(sale).data, status=201)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def invoice(self, request, pk=None):
        """Generate PDF invoice for a sale."""
        sale = self.get_object()
        return generate_invoice_pdf(sale)


# ======================================================================
# PADDY PURCHASE
# ======================================================================
class PaddyPurchaseViewSet(viewsets.ModelViewSet):
    queryset = PaddyPurchase.objects.select_related('user')
    serializer_class = PaddyPurchaseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['paddy_type']
    search_fields = ['farmer_name']
    ordering_fields = ['created_at', 'quantity_kg']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ======================================================================
# RICE BRAN SALE
# ======================================================================
class RiceBranSaleViewSet(viewsets.ModelViewSet):
    queryset = RiceBranSale.objects.all()
    serializer_class = RiceBranSaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product_type']
    search_fields = ['buyer_name']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ======================================================================
# INVENTORY
# ======================================================================
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['item_type']

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Return items with low stock."""
        low = Inventory.objects.filter(
            quantity_kg__lte=F('low_stock_threshold')
        )
        return Response(InventorySerializer(low, many=True).data)


# ======================================================================
# STOCK MOVEMENT
# ======================================================================
class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related('inventory')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'inventory']
    ordering_fields = ['created_at']


# ======================================================================
# REPORTS
# ======================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Dashboard statistics."""
    try:
        today = timezone.now().date()
        month_start = today.replace(day=1)

        # Today's sales
        today_sales = Sale.objects.filter(
            created_at__date=today
        ).aggregate(
            total=Sum('net_amount'),
            count=Count('id'),
        )

        # Monthly sales
        month_sales = Sale.objects.filter(
            created_at__date__gte=month_start
        ).aggregate(
            total=Sum('net_amount'),
            count=Count('id'),
        )

        # Paddy purchases this month
        month_paddy = PaddyPurchase.objects.filter(
            created_at__date__gte=month_start
        ).aggregate(
            total=Sum('total_amount'),
            quantity=Sum('quantity_kg'),
        )

        # Low stock count
        low_stock_count = Product.objects.filter(
            stock_kg__lte=F('low_stock_threshold'), is_active=True
        ).count()

        # Inventory summary
        inventory_summary = list(
            Inventory.objects.values('item_type').annotate(
                total_kg=Sum('quantity_kg')
            )
        )

        # Recent sales (last 5)
        recent_sales_qs = (
            Sale.objects.select_related('customer', 'user')
            .prefetch_related('items__product')
            .order_by('-created_at')[:5]
        )
        recent_sales = SaleSerializer(recent_sales_qs, many=True).data

        return Response({
            'today_sales': {
                'total': today_sales['total'] or 0,
                'count': today_sales['count'] or 0,
            },
            'month_sales': {
                'total': month_sales['total'] or 0,
                'count': month_sales['count'] or 0,
            },
            'month_paddy': {
                'total': month_paddy['total'] or 0,
                'quantity': month_paddy['quantity'] or 0,
            },
            'low_stock_count': low_stock_count,
            'inventory_summary': inventory_summary,
            'recent_sales': recent_sales,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def daily_sales_report(request):
    """Daily sales breakdown for the past 30 days."""
    today = timezone.now().date()
    start = today - timedelta(days=30)

    sales = (
        Sale.objects
        .filter(created_at__date__gte=start)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(
            total=Sum('net_amount'),
            count=Count('id'),
        )
        .order_by('day')
    )
    # Convert date objects to strings for JSON
    result = [
        {'day': str(row['day']), 'total': row['total'], 'count': row['count']}
        for row in sales
    ]
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def monthly_sales_report(request):
    """Monthly sales breakdown for the past 12 months."""
    today = timezone.now().date()
    start = today.replace(day=1) - timedelta(days=365)

    sales = (
        Sale.objects
        .filter(created_at__date__gte=start)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(
            total=Sum('net_amount'),
            count=Count('id'),
        )
        .order_by('month')
    )
    # Format month as YYYY-MM string
    result = [
        {'month': row['month'].strftime('%Y-%m'), 'total': row['total'], 'count': row['count']}
        for row in sales
    ]
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def profit_report(request):
    """Profit summary: Sales income vs Paddy purchase cost."""
    today = timezone.now().date()
    month_start = today.replace(day=1)

    sales_total = Sale.objects.filter(
        created_at__date__gte=month_start
    ).aggregate(total=Sum('net_amount'))['total'] or 0

    bran_total = RiceBranSale.objects.filter(
        created_at__date__gte=month_start
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    paddy_cost = PaddyPurchase.objects.filter(
        created_at__date__gte=month_start
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    income = Decimal(str(sales_total)) + Decimal(str(bran_total))
    profit = income - Decimal(str(paddy_cost))

    return Response({
        'period': f"{month_start} to {today}",
        'rice_sales': sales_total,
        'bran_sales': bran_total,
        'total_income': income,
        'paddy_cost': paddy_cost,
        'gross_profit': profit,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_sales_excel(request):
    """Export all sales as Excel."""
    sales = Sale.objects.select_related('customer', 'user').all()
    headers = ['Invoice #', 'Date', 'Customer', 'Total', 'Discount',
               'Net Amount', 'Payment', 'Cashier']
    rows = [
        [
            s.invoice_number,
            s.created_at.strftime('%Y-%m-%d %H:%M'),
            s.customer.name if s.customer else 'Walk-in',
            s.total_amount,
            s.discount,
            s.net_amount,
            s.get_payment_method_display(),
            s.user.username if s.user else '-',
        ]
        for s in sales
    ]
    return generate_excel_report('Sales_Report', headers, rows)
