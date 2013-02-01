from django.shortcuts import render_to_response, render
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils import simplejson
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.core import serializers
from django.core.exceptions import MultipleObjectsReturned
from django.core.servers.basehttp import FileWrapper
from django.db.models import Q
import json

from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm

from apps.game.models import Game, Revision, Author, Highscore, Review, Image, Thumbnail
from apps.game.forms import GameForm
from apps.game.decorators import ajax_login_required

from django.contrib.auth.models import User
from magos.settings import USER_MEDIA_PREFIX

def home(request):
    tpl = 'apps/game/index.html'
    user = request.user
    ses = request.session
    """
    sess_id = request.COOKIES['sessionid']
    from django.contrib.sessions.models import Session
    print sess_id
    print ses.load()
    redis_ses_key = ses.get_real_stored_key(sess_id)
    print redis_ses_key
    """
    if user.is_anonymous():
        #print "CREATE ANONYMOUS SESSION"
        ses['username'] = 'anonymous'
        ses['role'] = 'player'
        ses['lang'] = 'english'
        ses['organization'] = 'magos'
        ses['firstname'] = 'Magos'
        ses['lastname'] = 'Player'

    return render(request, tpl, {'user': user})

def game_details(request, gameslug):
    """Game details"""
    tpl = 'apps/game/details.html'
    user = request.user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    editor_url = settings.MAGOS_EDITOR_URL
    game = None
    authors = []
    can_edit = False
    highscores = []
    has_reviewed = False
    num_reviews = 0
    avg_stars = 0
    users = []
    can_review = False
    try:
        if not user.is_authenticated():
            game = Game.objects.get(slug=gameslug, state=2)
        else:
            game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)            
        authors = game.author_set.all()
        for author in authors:
            users.append(author.user)
        if user in users:
            can_edit = True
        # top 10 highscore
        highscores = Highscore.objects.filter(game=game).order_by('-score')[:10]
        if user.is_authenticated():
            can_review = True
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
                stars_total += star['stars']
            avg_stars = float(stars_total) / num_reviews

    except Game.DoesNotExist:
        pass
    return render(request, tpl, {'user': user, 'game':game, 'users': users, 'can_edit': can_edit, \
                'highscores' : highscores, 'has_reviewed':has_reviewed, 'num_reviews':num_reviews, 'avg_stars':avg_stars, \
                'can_review': can_review, 'editor_url' : editor_url })


def download_image(request, uuid, width, height):
    """View for downloading image with uuid.
       Creates image with given width and height on the fly
       if it does not exist."""
    #import ipdb;ipdb.set_trace()
    originals = Image.objects.filter(image_uuid=uuid)
    if len(originals) == 0:
        raise Http404("Image not found")
    original = originals[0]

    try:
        thumbnail_obj, created = Thumbnail.objects.get_or_create(\
            original=original, width=width, height=height)
    except MultipleObjectsReturned:
        thumbnail_obj = Thumbnail.objects.filter(original=original.file,
                        width=width, height=height)[0]
    thumbnail = thumbnail_obj.get_or_create_thumbnail()
    """
    if not thumbnail:
        return _show_other_thumbnail(settings.MEDIA_ROOT + \
                        "/customi/images/content/default.png",
                        width, height)
    """
    wrapper = FileWrapper(open(thumbnail.path))
    response = HttpResponse(wrapper, content_type=str(original.content_type))
    response['Content-Length'] = thumbnail.size
    return response



@login_required
def create_game(request):
    tpl = 'apps/game/create.html'
    user = request.user
    organization = user.get_profile().organization
    if request.method == 'POST':
        form = GameForm(request.POST, request.FILES)
        if form.is_valid():
            game = form.save()
            # figure out game resolution
            resolution = form.cleaned_data['resolution']
            resolution = resolution.split('_')
            cols = 14
            rows = 10
            if len(resolution) == 2:
                cols = int(resolution[0])
                rows = int(resolution[1])
            # create initial revision
            revision_data = {}
            canvas_data = {
                "blockSize": game.block_size,
                "columns": cols,
                "rows": rows
            }
            scenes_data = [
                {
                    "name" : "intro",
                    "sceneComponents" : [],
                    "gameComponents" : []
                },
                {
                    "name" : "game",
                    "sceneComponents" : [],
                    "gameComponents" : []
                },
                {
                    "name" : "outro",
                    "sceneComponents" : [],
                    "gameComponents" : []
                }
            ]
            revision_data['canvas'] = canvas_data
            revision_data['gameComponents'] = []
            revision_data['scenes'] = scenes_data


            #revision_data = revision_data.strip()
            revision_data = json.dumps(revision_data)
            revision = Revision(game=game, data=revision_data)
            revision.save()
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
        # should we add public (state=2) games?
    else:
        # anonymous users get list of public games, state=2
        games = Game.objects.filter(state=2)
    data = { 'games': games }
    return render_to_response( tpl, data, context_instance = RequestContext(request))

