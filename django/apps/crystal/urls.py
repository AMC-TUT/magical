from django.conf.urls.defaults import patterns, url
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('',
    url(r'^$', 'apps.crystal.views.home'),
    url(r'^ajax_list_words/(?P<slug>[-\w]+)$', 'apps.crystal.views.ajax_list_words'),
	url(r'^description/$', 'apps.crystal.views.description_form', name="description_form"),
    url(r'^description/success/$', direct_to_template, {'template' : 'apps/crystal/success.html'},
        name="description_success"),
)
