from django.shortcuts import render_to_response, render
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils import simplejson
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.core import serializers

from django.contrib.auth.forms import AuthenticationForm

from apps.game.models import Game
from django.contrib.auth.models import User

def home(request):
    tpl = 'apps/game/index.html'
    user = request.user
    
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
    return render(request, tpl, {'user': user})

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


def api_users(request, foo):
    users = User.objects.all()
    data = serializers.serialize('json', users, fields=('first_name','last_name'))
    
    #response_data = dict()
    #response_data['users'] = items
    
    #json_data = simplejson.dumps(data)
    return HttpResponse(data, mimetype="application/json")
