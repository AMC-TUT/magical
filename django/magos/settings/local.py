"""Development settings"""
from base import *

########## DEBUG CONFIGURATION
DEBUG = True
TEMPLATE_DEBUG = DEBUG
########## END DEBUG CONFIGURATION


########## EMAIL CONFIGURATION
#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
########## END EMAIL CONFIGURATION


########## URL CONFIGURATION
BASE_URL = 'http://localhost:8080/'

MAGOS_EDITOR_URL = 'http://localhost:8080/editor/edit/'
MAGOS_PLAY_URL = 'http://localhost:8080/editor/play/'

MAGOS_LITE_EDITOR_URL = 'http://localhost:8080/editor-lite/edit/'
MAGOS_LITE_PLAY_URL = 'http://localhost:8080/editor-lite/play/'

########## END URL CONFIGURATION


########## DATABASE CONFIGURATION
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'magos',
        'USER': get_env_variable('MAGOS_MYSQL_USER'),
        'PASSWORD': get_env_variable('MAGOS_MYSQL_PWD'),
        'HOST': '',
        'PORT': '',
    }
}
########## END DATABASE CONFIGURATION


########## CACHE CONFIGURATION
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
########## END CACHE CONFIGURATION


########## TOOLBAR CONFIGURATION
INSTALLED_APPS += (
    #'debug_toolbar',
)

DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': False,
}

INTERNAL_IPS = ('127.0.0.1',)

MIDDLEWARE_CLASSES += (
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
)
########## END TOOLBAR CONFIGURATION
