"""Common settings and globals."""
#import os.path import abspath, basename, dirname, join, normpath, join
#from os import environ
import os
from sys import path

from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import ugettext_lazy as _

def get_env_variable(var_name):
    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)


########## PATH CONFIGURATION
# Absolute filesystem path to the Django project directory:
DJANGO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Absolute filesystem path to the top-level project folder:
SITE_ROOT = os.path.dirname(DJANGO_ROOT)

# Site name:
SITE_NAME = os.path.basename(DJANGO_ROOT)

# Add our project to our pythonpath, this way we don't need to type our project
# name in our dotted import paths:
path.append(DJANGO_ROOT)
########## END PATH CONFIGURATION


########## DEBUGGING
DEBUG = False
TEMPLATE_DEBUG = DEBUG
########## END DEBUG


########## DATABASE CONFIGURATION
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.',
        'NAME': '',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}
########## END DATABASE CONFIGURATION


########## GENERAL CONFIGURATION

TIME_ZONE = 'Europe/Helsinki'
LANGUAGE_CODE = 'en'
SITE_ID = 1
USE_I18N = True
USE_L10N = True
USE_TZ = True
gettext = lambda s: s
LANGUAGES = (
    ('en', _('English')),
    ('fi', _('Finnish')),
    ('it', _('Italian')),
)
LOCALE_PATHS = (
    os.path.normpath(os.path.join(SITE_ROOT, 'locale')),
)
########## END GENERAL CONFIGURATION


########## REDIS SESSION CONFIGURATION

SESSION_ENGINE = 'magos.json_redis_session'
SESSION_REDIS_HOST = 'localhost'
SESSION_REDIS_PORT = 6379
SESSION_REDIS_DB = 0
SESSION_REDIS_PREFIX = 'django_session'
SESSION_COOKIE_HTTPONLY = False
GAME_REDIS_PREFIX = 'game'

########## END REDIS SESSION CONFIGURATION


########## MEDIA CONFIGURATION
#MEDIA_ROOT = normpath(join(SITE_ROOT, 'media'))
MEDIA_URL = '/media/'
USER_MEDIA_PREFIX = 'user-media/images/'
MEDIA_ROOT = os.path.join(get_env_variable('DJANGO_DATA_DIR'), "magos", "media")
########## END MEDIA CONFIGURATION


########## STATIC FILE CONFIGURATION
# static files are collected here by collectstatic
STATIC_ROOT = os.path.join(get_env_variable('DJANGO_DATA_DIR'), "magos", "static")

STATIC_URL = '/static/'

# places to get static files from
STATICFILES_DIRS = (
    os.path.normpath(os.path.join(SITE_ROOT, 'static')),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)
########## END STATIC FILE CONFIGURATION


########## SECRET CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
# Note: This key only used for development and testing.
SECRET_KEY = get_env_variable('MAGOS_SERCRET_KEY')
########## END SECRET CONFIGURATION


########## SITE CONFIGURATION
# Hosts/domain names that are valid for this site
ALLOWED_HOSTS = []
########## END SITE CONFIGURATION


########## AUTHENTICATION

AUTH_PROFILE_MODULE = 'game.UserProfile'
LOGIN_URL = '/game/login'

########## END AUTHENTICATION


########## FIXTURES
FIXTURE_DIRS = (
    os.path.normpath(os.path.join(SITE_ROOT, 'fixtures')),
)
########## END FIXTURES


########## TEMPLATES
TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.static',
    'django.core.context_processors.tz',
    'django.contrib.messages.context_processors.messages',
    'django.core.context_processors.request',
    'apps.game.context_processors.include_login_form',
)

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_DIRS = (
    os.path.normpath(os.path.join(SITE_ROOT, 'templates')),
)
########## END TEMPLATES


########## MIDDLEWARE
MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'audiofield.middleware.threadlocals.ThreadLocals', #django-audiofield
    # Uncomment the next line for simple clickjacking protection:
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)
########## END MIDDLEWARE


########## FILE UPLOAD HANDLERS
FILE_UPLOAD_HANDLERS = (
    #'apps.game.upload_handlers.ContentUploadHandler',
    #'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
)
########## END FILE UPLOAD HANDLERS


########## URL CONFIGURATION
ROOT_URLCONF = '%s.urls' % SITE_NAME
########## END URL CONFIGURATION


########## APP CONFIGURATION
DJANGO_APPS = (
    # Default Django apps:
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Useful template tags:
    # 'django.contrib.humanize',
    # Admin panel and documentation:
    'django.contrib.admin',
    # 'django.contrib.admindocs',
)

THIRD_PARTY_APPS = (
    'south',
    'django_extensions',
    'djangorestframework',
    'audiofield', #django-audiofield
    'djcelery',
    'imagekit',
    'polymorphic',
)

# Apps specific for this project
LOCAL_APPS = (
    'apps.game',
    'apps.crystal',
)

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS
########## END APP CONFIGURATION


########## LOGGING
# See: https://docs.djangoproject.com/en/dev/ref/settings/#logging
# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}
########## END LOGGING


########## WSGI CONFIGURATION
WSGI_APPLICATION = 'wsgi.application'
########## END WSGI CONFIGURATION
