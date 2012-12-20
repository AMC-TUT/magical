from django.conf.urls import patterns, include, url
from apps.game.api import UserResource
#from tastypie.api import Api
from djangorestframework.views import ListOrCreateModelView, InstanceModelView
from django.conf import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from django.contrib import admin
admin.autodiscover()

#v1_api = Api(api_name='v1')
#v1_api.register(LanguageResource())
#v1_api.register(UserResource())

#language_resource = LanguageResource()
#user_resource = UserResource()


urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'apps.game.views.home', name='home'),
    # url(r'^magos/', include('magos.foo.urls')),
    url(r'^game/', include('apps.game.urls')),

    url(r'^crystal/', include('apps.crystal.urls')),

    #url(r'^accounts/logout/$', 'django.contrib.auth.views.logout'),
    
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # REST API
    #(r'^api/', include(user_resource.urls)),
    #(r'^api/', include(language_resource.urls)),
    #(r'^api/', include(v1_api.urls)),
    url(r'^restframework', include('djangorestframework.urls', namespace='djangorestframework')),
    
    #url(r'^api/v1/users(/)?$', ListOrCreateModelView.as_view(resource=UserResource)),
    #url(r'^api/v1/users/(?P<pk>[^/]+)/$', InstanceModelView.as_view(resource=UserResource)),
    
    #url(r'^api/users(/)?$', 'apps.game.views.api_users'),
    url(r'^api/v1/', include('apps.api.urls')),
    
    #(r'^crystal/', 'django.views.generic.simple.direct_to_template', {'template': 'crystal/index.html'}),
    
    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),

    url(r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/static/favicon.ico'}),

)

#if settings.DEBUG:
    # static files (images, css, javascript, etc.)
#    urlpatterns += patterns('',
#        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {
#        'document_root': settings.MEDIA_ROOT}))
if settings.DEBUG:
    urlpatterns += patterns('',
        url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
            'document_root': settings.MEDIA_ROOT,
        }),
   )
# for development with some other server than runserver
urlpatterns += staticfiles_urlpatterns()
