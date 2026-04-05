"""
ASGI config for ricemill project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ricemill.settings')
application = get_asgi_application()
