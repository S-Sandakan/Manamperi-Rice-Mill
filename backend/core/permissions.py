"""
Custom permissions for Manamperi Rice Mill.
"""
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Only admin-role users or Django superusers can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsAdminOrReadOnly(BasePermission):
    """Admin can do anything; staff can only read."""

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_superuser)
        )

