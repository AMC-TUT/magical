from django.conf.urls.defaults import patterns, url
from apps.api.views import UsersListView, UserDetailView, LanguagesListView, HighscoreListView, \
    GameReviewView, ImageView, ImageUpdateView, ImageSearchView, AudioView, AudioUpdateView, \
    AudioSearchView, GameView, GameDetailView, RevisionView, UsersGamesView, AnonUserCreateView

urlpatterns = patterns('',
    # PORTAL
    # game reviews
    url(r'^reviews$', GameReviewView.as_view(), name='game-review-view'),

    # EDITOR
    # images
    url(r'^images$', ImageView.as_view(), name='image-view'), # POST, GET
    url(r'^images/(?P<imageslug>[\w.@+-]+)$', ImageUpdateView.as_view(), name='image-update-view'), # PUT
    url(r'^images/search/$', ImageSearchView.as_view(), name='image-search-view'), # GET
    
    # audios
    url(r'^audios$', AudioView.as_view(), name='audio-view'), # POST
    url(r'^audios/(?P<audioslug>[\w.@+-]+)$', AudioUpdateView.as_view(), name='audio-update-view'), # PUT
    url(r'^audios/search/$', AudioSearchView.as_view(), name='audio-search-view'), # GET

    # games
    url(r'^games$', GameView.as_view(), name='game-view'), # GET, POST
    url(r'^games/(?P<gameslug>[\w.@+-]+)$', GameDetailView.as_view(), name='game-detail-view'), #GET, PUT

    url(r'^users_games/(?P<username>[\w.@+-]+)$', UsersGamesView.as_view(), name='users-games-view'), # GET

    # revisions
    url(r'^revisions/(?P<gameslug>[\w.@+-]+)$', RevisionView.as_view(), name='revision-view'), #GET, POST
    
    # users
    url(r'^users$', UsersListView.as_view(), name='users-list-view'),
    url(r'^users/(?P<username>[\w.@+-]+)$', UserDetailView.as_view(), name='user-detail-view'),

    url(r'^user/create/$', AnonUserCreateView.as_view(), name='anon-user-create-view'),

    # highscores
    url(r'^highscores/(?P<gameslug>[\w.@+-]+)$', HighscoreListView.as_view(), name='highscore-list-view'),

    # languages
    url(r'^languages$', LanguagesListView.as_view(), name='languages-list-view'),

)
