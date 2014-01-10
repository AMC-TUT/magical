"""Production settings and globals."""
from base import *

########## EDITOR/PLAY URL CONFIGURATION
MAGOS_EDITOR_URL = 'http://magos.pori.tut.fi/editor/'
MAGOS_PLAY_URL = 'http://magos.pori.tut.fi/play/'

MAGOS_LITE_EDITOR_URL = 'http://magos.pori.tut.fi/editor-lite/edit/'
MAGOS_LITE_PLAY_URL = 'http://magos.pori.tut.fi/editor-lite/play/'

########## END EDITOR/PLAY URL CONFIGURATION


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


########## SITE CONFIGURATION
# Hosts/domain names that are valid for this site
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ['magos.pori.tut.fi']
########## END SITE CONFIGURATION
