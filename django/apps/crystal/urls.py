from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('',
    url(r'^$', 'apps.crystal.views.home'),
    url(r'^ajax_list_words/(?P<slug>[-\w]+)$', 'apps.crystal.views.ajax_list_words'),    
)
