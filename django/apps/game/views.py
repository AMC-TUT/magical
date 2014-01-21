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

from django.contrib.auth.forms import AuthenticationForm

from apps.game.models import Game, MagosAGame, MagosBGame, Revision, Author, \
        Highscore, Review, Image, Thumbnail
from apps.game.forms import MagosAGameForm, MagosBGameForm
from apps.game.decorators import ajax_login_required
from apps.game.utils import get_redis_game_data, set_redis_game_data, create_game_for_redis

from django.contrib.auth.models import User
from django.conf import settings

def home(request):
    tpl = 'apps/game/index.html'
    context = RequestContext(request)
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

    context['user'] = user
    return render(request, tpl, context)

def game_details(request, gameslug):
    """Game details"""
    tpl = 'apps/game/details.html'
    context = RequestContext(request)
    user = request.user
    context['user'] = user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    game = None
    authors = []
    can_edit = False
    highscores = []
    has_reviewed = False
    num_reviews = 0
    avg_stars = 0
    game_authors = []
    can_review = False
    available_authors = []
    editor_url = settings.MAGOS_EDITOR_URL
    play_url = settings.MAGOS_PLAY_URL
    try:
        if not user.is_authenticated():
            game = Game.objects.get(slug=gameslug, state=2)
        else:
            game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)            
        authors = game.author_set.all()
        for author in authors:
            game_authors.append(author.user)
        if user in game_authors or user == game.creator:
            can_edit = True
        # authors that can be added as game authors
        available_authors = User.objects.filter(userprofile__organization=organization).exclude(id__in=[o.id for o in game_authors])
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

    if game.get_real_instance_class() == MagosBGame:        
        editor_url = settings.MAGOS_LITE_EDITOR_URL
        play_url = settings.MAGOS_LITE_PLAY_URL
    # set context variables
    context['game'] = game
    context['user'] = user
    context['game_authors'] = game_authors
    context['available_authors'] = available_authors
    context['can_edit'] = can_edit
    context['highscores'] = highscores
    context['has_reviewed'] = has_reviewed
    context['num_reviews'] = num_reviews
    context['avg_stars'] = avg_stars
    context['can_review'] = can_review
    context['editor_url'] = editor_url
    context['play_url'] = play_url

    return render(request, tpl, context)


def download_image(request, uuid, width, height, ext):
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
def create_game_base(request):
    tpl = 'apps/game/create_base.html'
    context = RequestContext(request)
    user = request.user
    organization = user.get_profile().organization
    return render(request, tpl, context)


@login_required
def create_game_a(request):
    tpl = 'apps/game/create.html'
    context = RequestContext(request)
    user = request.user
    organization = user.get_profile().organization
    GameForm = MagosAGameForm
    context['gametype_text'] = 'Classic'
    if request.method == 'POST':
        form = GameForm(request.POST, request.FILES, organization=organization)
        if form.is_valid():
            #import ipdb; ipdb.set_trace()
            # figure out game resolution
            resolution = form.cleaned_data['resolution']
            resolution = resolution.split('_')
            cols = 14
            rows = 10
            if len(resolution) == 2:
                cols = int(resolution[0])
                rows = int(resolution[1])
            game = form.save()
            game.creator = user
            game.rows = rows
            game.cols = cols
            game.save()
            
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

            # we have to create and save initial game data to Redis
            redis_game_data = create_game_for_redis(game.slug)
            jresult = json.dumps(redis_game_data)
            set_redis_game_data(game.slug, jresult)

            # redirect to newly created game
            url = '/game/details/%s' % game.slug
            #return redirect(url)
            data = {
                'success': True,
                'url': url
            }

        else:
            data = {
                'errors': dict([(k, [unicode(e) for e in v]) for k,v in form.errors.items()])
            }

        json_data = simplejson.dumps(data)
        return HttpResponse(json_data, mimetype='application/json')
    else:
        form = GameForm(organization=organization)
    context['form'] = form
    return render(request, tpl, context)

@login_required
def create_game_b(request):
    tpl = 'apps/game/create.html'
    context = RequestContext(request)
    user = request.user
    organization = user.get_profile().organization
    GameForm = MagosBGameForm
    context['gametype_text'] = 'Lite'
    if request.method == 'POST':
        form = GameForm(request.POST, request.FILES, organization=organization)
        if form.is_valid():
            game = form.save()
            game.creator = user
            game.save()
            
            # create initial revision
            revision_data = {}
            
            scroll_data = [
                {
                    "item" : None,
                    "speed" : 5
                },
                {
                    "item" : None,
                    "speed" : 10
                },
                {
                    "item" : None,
                    "speed" : 15
                }
            ]
            revision_data['title'] = game.title
            revision_data['instructions'] = ""
            revision_data['platformType'] = "air"
            revision_data['playerImg'] = "magos-girl" 
            revision_data['itemInterval'] = 4000
            revision_data['hazardInterval'] = 5000
            revision_data['wordInterval'] = 4000
            revision_data['sky'] = None
            revision_data['scroll'] = scroll_data
            revision_data['collectables'] = []
            revision_data['hazards'] = []
            revision_data['powerups'] = []
            revision_data['wordRules'] = []
            revision_data['answers'] = []
            revision_data['fractionRules'] = []
            revision_data['matchRule'] = None
            revision_data['gameMode'] = "time"
            revision_data['gameDuration'] = 60
            revision_data['goalDistance'] = 400
            revision_data['survivalFactor'] = 0.95
            revision_data['extraLife'] = False
            revision_data['turboSpeed'] = False
            revision_data['bgcolor'] = "#F2F2F2"

            revision_data['star3limit'] = 2000
            revision_data['star2limit'] = 1000 
            revision_data['star1limit'] = 500
            revision_data['memoryIncrease'] = 0 
            revision_data['memoryStart'] = 0
            revision_data['matchPointsRight'] = 0
            revision_data['matchPointsWrong'] = 0 
            revision_data['hazardEffect'] = 0
            revision_data['sliceAmount'] = 0 
            revision_data['pieceAmount'] = 0 
            revision_data['pizzaRules'] = [] 
            revision_data['jumpPower'] = -24 
            revision_data['bonustimelimit'] = 220 

            revision_data = json.dumps(revision_data)

            revision = Revision(game=game, data=revision_data)
            revision.save()
            # add user as author
            author = Author(game=game, user=user)
            author.save()

            # we have to create and save initial game data to Redis
            redis_game_data = create_game_for_redis(game.slug)
            jresult = json.dumps(redis_game_data)
            set_redis_game_data(game.slug, jresult)

            # redirect to newly created game
            url = '/game/details/%s' % game.slug
            #return redirect(url)
            data = {
                'success': True,
                'url': url
            }

        else:
            data = {
                'errors': dict([(k, [unicode(e) for e in v]) for k,v in form.errors.items()])
            }

        json_data = simplejson.dumps(data)
        return HttpResponse(json_data, mimetype='application/json')
    else:
        form = GameForm(organization=organization)
    context['form'] = form
    return render(request, tpl, context)


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


def add_author(request, gameslug):
    """
    Add author to game
    :param request: Http request object.
    :param gameslug: Slug for the game.
    """
    game = None
    try:
        game = Game.objects.get(slug=gameslug)
    except Game.DoesNotExist:
        raise Http404

    if request.method == 'POST':
        author_id = request.POST.get('available_author', None)
        if author_id:
            user = User.objects.get(id=author_id)
            if user and game:
                game_author, created = Author.objects.get_or_create(user=user, game=game)
                # we have to edit redis game data too, so get it...
                data = get_redis_game_data(gameslug)
                print data
                jdata = json.loads(data)
                authors = jdata.get('authors', None)
                if not any(author.get('userName', None) == user.username for author in authors):
                    # author not yet in game authors, add it
                    #print 'add %s as an author' % (user.username)
                    new_author = {
                        'userName' : user.username,
                        'firstName' : user.first_name,
                        'lastName' : user.last_name,
                        'magos' : None
                    }
                    authors.append(new_author)
                    jdata['authors'] = authors
                    jresult = json.dumps(jdata)
                    # ...and write modified data back to redis
                    set_redis_game_data(gameslug, jresult)

    # redirect to game details page
    return redirect(game_details, gameslug=gameslug)


def remove_author(request, gameslug, username):
    user = request.user
    authors = []
    allowed_to_modify = False
    game = Game.objects.get(slug=gameslug)
    if game:
        try:
            author = game.author_set.get(user__username=username)
            author.delete()
            data = get_redis_game_data(gameslug)
            jdata = json.loads(data)
            authors = jdata.get('authors', None)
            if any(author.get('userName', None) == user.username for author in authors):
                # author in game authors, remove it
                for author in authors:
                    if author['userName'] == username:
                        authors.remove(author)
                        break
                jdata['authors'] = authors
                jresult = json.dumps(jdata)
                # ...and write modified data back to redis
                set_redis_game_data(gameslug, jresult)
        except Author.DoesNotExist:
            pass

    json_data = simplejson.dumps({ 'success': True })
    return HttpResponse(json_data, mimetype='application/json')


def game_authors(request, gameslug):
    tpl = 'apps/game/ajax_list_game_authors.html'
    context = RequestContext(request)
    user = request.user
    authors = []
    allowed_to_modify = False
    game = Game.objects.get(slug=gameslug)
    if game:
        authors = game.author_set.all()
        game_author_ids = authors.values_list('user', flat=True)
        if user.id in game_author_ids or user == game.creator:
            allowed_to_modify = True
    #print allowed_to_modify
    #print authors
    context['authors'] = authors
    context['allowed_to_modify'] = allowed_to_modify
    return render(request, tpl, context)


def available_authors(request, gameslug):
    tpl = 'apps/game/ajax_list_available_authors.html'
    context = RequestContext(request)
    user = request.user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    available_authors = []
    game = Game.objects.get(slug=gameslug)
    allowed_to_modify = False
    if game and organization:
        game_author_ids = game.author_set.all().values_list('user', flat=True)
        if user.id in game_author_ids or user == game.creator:
            allowed_to_modify = True
        #print allowed_to_modify
        if allowed_to_modify:
            # authors that can be added as game authors
            available_authors = User.objects.filter(userprofile__organization=organization).exclude(id__in=game_author_ids)

    context['game'] = game
    context['available_authors'] = available_authors
    return render(request, tpl, context)


def ajax_list_games(request, gametype='A'):
    """
    Get game objects of type A or B (magos-lite).
    :param request: Http request object.
    :param gametype: Game type as string 'A' or 'B'.
    """
    if not gametype in ['A', 'B']:
        gametype = 'A'
    TypedGame = MagosAGame
    if gametype == 'B':
        TypedGame = MagosBGame

    tpl = 'apps/game/ajax_list_games.html'
    context = RequestContext(request)
    user = request.user
    if user.is_authenticated():
        # authenticated users get list of their own games
        games = TypedGame.objects.filter(author__user__userprofile__organization=user.userprofile.organization).distinct()
        # should we add public (state=2) games?
    else:
        # anonymous users get list of public games, state=2
        games = Game.objects.filter(state=2)
    context['games'] = games
    return render(request, tpl, context)
