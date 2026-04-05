"""
URL routing for the core API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'sales', views.SaleViewSet)
router.register(r'paddy-purchases', views.PaddyPurchaseViewSet)
router.register(r'bran-sales', views.RiceBranSaleViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'stock-movements', views.StockMovementViewSet)

urlpatterns = [
    # JWT Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Router-generated CRUD endpoints
    path('', include(router.urls)),

    # Reports
    path('reports/dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('reports/daily/', views.daily_sales_report, name='daily-sales'),
    path('reports/monthly/', views.monthly_sales_report, name='monthly-sales'),
    path('reports/profit/', views.profit_report, name='profit-report'),
    path('reports/export/sales/', views.export_sales_excel, name='export-sales'),
]
