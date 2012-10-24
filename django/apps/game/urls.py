from django.conf.urls.defaults import patterns, url
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('',
    url(r'^$', 'apps.game.views.home'),
    url(r'^ajax_list_games/$', 'apps.game.views.ajax_list_games'),

    url(r'^details/(?P<gameslug>[\w.@+-]+)$', 'apps.game.views.game_details', name="game_details"),
    url(r'^create/$', 'apps.game.views.create_game', name="create_game"),

	url(r'^rate/(?P<game_pk>\d*)/(?P<stars>0|1|2|3|4|5)$', 'apps.game.views.rate_game', name="rate_game"),

    url(r'^watch/$', direct_to_template, {'template': 'apps/game/watch.html'}, name="watch"),
    url(r'^invent/$', direct_to_template, {'template': 'apps/game/invent.html'}, name="invent"),

    url(r'^login$', 'django.contrib.auth.views.login', {'template_name': 'apps/game/login.html'}),
    #url(r'^login$', 'apps.game.views.login'),
    url(r'^logout/$', 'apps.game.views.logout_view'),
    
)
