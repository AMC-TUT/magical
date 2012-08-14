from django.conf.urls import patterns, include, url
from apps.game.api import UserResource, LanguageResource

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

language_resource = LanguageResource()
user_resource = UserResource()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'magos.views.home', name='home'),
    # url(r'^magos/', include('magos.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # REST API
    (r'^api/', include(user_resource.urls)),
    (r'^api/', include(language_resource.urls)),
    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
