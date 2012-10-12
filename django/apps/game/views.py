from django.shortcuts import render_to_response, render
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils import simplejson
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.core import serializers

from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm

from apps.game.models import Game, Author
from apps.game.forms import GameForm
from django.contrib.auth.models import User

def home(request):
    tpl = 'apps/game/index.html'
    user = request.user
    """
    sess_id = request.COOKIES['sessionid']
    from django.contrib.sessions.models import Session
    print sess_id
    try:
        sess_obj = Session.objects.get(session_key=sess_id)
        print(sess_obj.session_data)
        print(sess_obj.get_decoded())
        
    except Session.DoesNotExist:
        pass
    print Session.objects.all()
    """
    return render(request, tpl, {'user': user})

def game_details(request, gameslug):
    """Game details"""
    tpl = 'apps/game/details.html'
    user = request.user
    organization = user.get_profile().organization        
    game = None
    try:
        game = Game.objects.get(slug=gameslug, author__user__userprofile__organization=organization)
    except Game.DoesNotExist:
        pass
    return render(request, tpl, {'user': user, 'game':game})

@login_required
def create_game(request):
    tpl = 'apps/game/create.html'
    user = request.user
    organization = user.get_profile().organization
    if request.method == 'POST':
        form = GameForm(request.POST)
        if form.is_valid():
            game = form.save()
            # add user as author
            author = Author(game=game, user=user)
            author.save()
            # redirect to newly created game
            url = '/game/details/%s' % game.slug
            return redirect(url)
    else:
        form = GameForm()

    return render(request, tpl, {'form':form})


def logout_view(request):
    logout(request)
    # redirect to home
    return redirect(home)
    

def ajax_list_games(request):
    """
    Get game objects.
    :param request: Http request object.
    """
    tpl = 'apps/game/ajax_list_games.html'
    user = request.user
    if user.is_authenticated():
        # authenticated users get list of their own games
        games = Game.objects.filter(author__user__userprofile__organization=user.userprofile.organization).distinct()
    else:
        # anonymous users get list of public games, state=2
        games = Game.objects.filter(state=2)
    data = { 'games': games }
    return render_to_response( tpl, data, context_instance = RequestContext(request))

