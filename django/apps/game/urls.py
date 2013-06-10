from django.conf.urls.defaults import patterns, url
from django.views.generic import TemplateView

urlpatterns = patterns('',
    url(r'^$', 'apps.game.views.home'),
    url(r'^ajax_list_games/$', 'apps.game.views.ajax_list_games'),

    url(r'^details/(?P<gameslug>[\w.@+-]+)$', 'apps.game.views.game_details', name="game_details"),
    url(r'^create/$', 'apps.game.views.create_game', name="create_game"),

    url(r'^game-authors/(?P<gameslug>[\w.@+-]+)$', 'apps.game.views.game_authors', name="game_authors"),
    url(r'^available-authors/(?P<gameslug>[\w.@+-]+)$', 'apps.game.views.available_authors', name="available_authors"),
    url(r'^add-author/(?P<gameslug>[\w.@+-]+)$', 'apps.game.views.add_author', name="add_author"),
    url(r'^remove-author/(?P<gameslug>[\w.@+-]+)/(?P<username>[\w.@+-]+)$', 'apps.game.views.remove_author', name="remove_author"),

    url(r'^image/(?P<uuid>[a-z0-9-]{36})_(?P<width>\d+)x(?P<height>\d+).(?P<ext>png|jpg|jpeg|gif+)$', 'apps.game.views.download_image'),
    
	url(r'^rate/(?P<game_pk>\d*)/(?P<stars>0|1|2|3|4|5)$', 'apps.game.views.rate_game', name="rate_game"),

    #url(r'^watch/$', direct_to_template, {'template': 'apps/game/watch.html'}, name="watch"),
    url(r'^watch/$', TemplateView.as_view(template_name='apps/game/watch.html'), name='watch'),
    url(r'^invent/$', TemplateView.as_view(template_name='apps/game/invent.html'), name='invent'),

    url(r'^login$', 'django.contrib.auth.views.login', {'template_name': 'apps/game/login.html'}),
    #url(r'^login$', 'apps.game.views.login'),
    url(r'^logout/$', 'apps.game.views.logout_view'),
    
)
