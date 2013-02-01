﻿import apps, sys, os
from django.conf import global_settings
import djcelery

djcelery.setup_loader()

#if "C:\\work\\projektit\\mag\\magical\\django" not in sys.path:
#    sys.path.append("C:\\work\\projektit\\mag\\magical\\django")
    
# Django settings for magos project.
PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..")) 

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'magos',                      # Or path to database file if using sqlite3.
        'USER': 'magos',                      # Not used with sqlite3.
        'PASSWORD': 'amc2k12',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    }
}

#SESSION_ENGINE = 'redis_sessions.session'
SESSION_ENGINE = 'magos.json_redis_session'
SESSION_REDIS_HOST = 'localhost'
SESSION_REDIS_PORT = 6379
SESSION_REDIS_DB = 0
#SESSION_REDIS_PASSWORD = 'password'
SESSION_REDIS_PREFIX = 'django_session'
SESSION_COOKIE_HTTPONLY = False

# using Celery with Redis as a broker
BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

#MAGOS_EDITOR_URL = 'http://magos.pori.tut.fi/editor/'
MAGOS_EDITOR_URL = 'http://localhost:8080/editor/'

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'Europe/Helsinki'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-US'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = '/Users/mkoskela/dev/django_media/magos/'
#MEDIA_ROOT = 'c:/work/www/django_media/'
#MEDIA_ROOT = '/home/mkoskela/magos_media/'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = '/media/'
USER_MEDIA_PREFIX = 'user-media/images/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
#STATIC_ROOT = ''
STATIC_ROOT = '/Users/mkoskela/dev/django_static/magos/'

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'
#STATIC_URL = 'http://130.230.177.131:8082/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    #'c:/work/projektit/mag/magical/django/static/',
    #'/Users/mkoskela/work/tut/projects/magos/code/magical/django/static/',
    PROJECT_DIR + '/static/',
    #'/home/mkoskela/dev/magical/django/static/',
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = '#7tzga@)0q=e@fga4qi4b!s!^v)ioaa*@w_9_-n_%=5ki3f%u#'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'audiofield.middleware.threadlocals.ThreadLocals', #django-audiofield
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'magos.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'magos.wsgi.application'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    #'c:/work/projektit/mag/magical/django/templates',
    #'/Users/mkoskela/work/tut/projects/magos/code/magical/django/templates',
    PROJECT_DIR + '/templates',
    #'/home/mkoskela/dev/magical/django/templates',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",
    "django.core.context_processors.request"
)


# Django-audiofile application settings
CHANNEL_TYPE_VALUE = 0  # 0-Keep original, 1-Mono, 2-Stereo

FREQ_TYPE_VALUE = 8000  # 0-Keep original, 8000-8000Hz, 16000-16000Hz, 22050-22050Hz,
                     # 44100-44100Hz, 48000-48000Hz, 96000-96000Hz

CONVERT_TYPE_VALUE = 0 # 0-Keep original, 1-Convert to MP3, 2-Convert to WAV, 3-Convert to OGG


# file upload handlers
FILE_UPLOAD_HANDLERS = (
    #'apps.game.upload_handlers.ContentUploadHandler',
    #'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
)
# -----------------------------------------------------------------------------
# Authentication
# -----------------------------------------------------------------------------

AUTH_PROFILE_MODULE = 'game.UserProfile'

LOGIN_URL = '/game/login'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'apps.game',
    'apps.crystal',
    'django_extensions',
    #'tastypie',
    'djangorestframework',
    'south',
    'audiofield', #django-audiofield
    'djcelery',
    'imagekit',
)

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
