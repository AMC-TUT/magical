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

from apps.game.models import Game, Author, Highscore, Review
from apps.game.forms import GameForm
from apps.game.decorators import ajax_login_required

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
    authors = []
    can_edit = False
    highscores = []
    has_reviewed = False
    num_reviews = 0
    avg_stars = 0
    try:
        game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)
        authors = game.author_set.all()
        users = []
        for author in authors:
            users.append(author.user)
        if user in users:
            can_edit = True
        # top 10 highscore
        highscores = Highscore.objects.filter(game=game).order_by('-score')[:10]
        try:
            review = Review.objects.get(game=game, user=user)
            has_reviewed = True
        except Review.DoesNotExist:
            pass

        stars = Review.objects.filter(game=game).values('stars')
        num_reviews = len(stars)
        stars_total = 0
        if stars:
            for star in stars:
                print star['stars']
                stars_total += star['stars']
            avg_stars = float(stars_total) / num_reviews

    except Game.DoesNotExist:
        pass
    return render(request, tpl, {'user': user, 'game':game, 'users': users, 'can_edit': can_edit, \
                'highscores' : highscores, 'has_reviewed':has_reviewed, 'num_reviews':num_reviews, 'avg_stars':avg_stars})

@login_required
def create_game(request):
    tpl = 'apps/game/create.html'
    user = request.user
    organization = user.get_profile().organization
    if request.method == 'POST':
        form = GameForm(request.POST, request.FILES)
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
    
@ajax_login_required    
def rate_game(request, game_pk, stars):
    """
    Rate game 1-5
    :param request: Http request object.
    :param game_pk: Primary key for Game to be rated.
    :param stars: Number of stars (1-5).
    """
    try:
        game = Game.objects.get(id=game_pk)
    except Game.DoesNotExist:
        raise Http404

    user = request.user
    stars = int(stars)
    print stars
    if stars in [0,1,2,3,4,5]:
        review = None
        try:
            review = Review.objects.get(game=game, user=user)
        except Review.DoesNotExist:
            pass
        if stars == 0:
            # set stars to 0, don't delete review
            if review:
                review.stars = 0
                review.save()
        else:
            # add review stars
            if review:
                review.stars = stars
            else:
                review = Review(game=game, user=user, stars=stars)
            review.save()

    json = simplejson.dumps({ 'success': True })
    return HttpResponse(json, mimetype='application/json')



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

