from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('',
    url(r'^$', 'apps.game.views.home'),
    url(r'^ajax_list_games/$', 'apps.game.views.ajax_list_games'),
    url(r'^login$', 'django.contrib.auth.views.login', {'template_name': 'apps/game/game_base.html'}),
    url(r'^logout/$', 'apps.game.views.logout_view'),
    
)
