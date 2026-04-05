"""
WSGI config for ricemill project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ricemill.settings')
application = get_wsgi_application()
