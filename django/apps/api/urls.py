from django.conf.urls.defaults import patterns, url
from apps.api.views import UsersListView, UserDetailView, LanguagesListView, HighscoreListView

urlpatterns = patterns('',
    # EDITOR
    
    # users
    url(r'^users$', UsersListView.as_view(), name='users-list-view'),
    url(r'^users/(?P<username>[\w.@+-]+)$', UserDetailView.as_view(), name='user-detail-view'),
    # highscores
    url(r'^highscores/(?P<gameslug>[\w.@+-]+)$', HighscoreListView.as_view(), name='highscore-list-view'),

    # languages
    url(r'^languages$', LanguagesListView.as_view(), name='languages-list-view'),

)
