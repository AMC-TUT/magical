from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils import simplejson
from django.contrib.auth import logout
from django.shortcuts import redirect

from apps.game.models import Game

def home(request):
    tpl = 'apps/game/index.html'
    user = request.user    
    return render_to_response(tpl, {'user' : user},
                          context_instance=RequestContext(request))

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
        print "FOOOO"
    else:
        # anonymous users get list of public games
        print "NOOO"
    #medi_bags = MediBag.objects.filter(visible=True).order_by('disabled','name')
    games = Game.objects.all()
    data = { 'games': games }
    return render_to_response( tpl, data, context_instance = RequestContext(request))
