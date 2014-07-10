from django.shortcuts import render_to_response, render, redirect
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.conf import settings
from django.contrib.auth import login, logout
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.core import serializers
from django.core.exceptions import MultipleObjectsReturned
from django.core.servers.basehttp import FileWrapper
from django.db.models import Q
from django.contrib import messages
import json
from crispy_forms.utils import render_crispy_form
from jsonview.decorators import json_view

from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm

from .models import Game, MagosAGame, MagosBGame, Revision, Author, \
        Highscore, Review, Image, Thumbnail, Language, UserSettings
from .forms import MagosAGameForm, MagosBGameForm, LoginForm, UserRegistrationForm, \
    BatchCreateUsersForm, GameImageForm, UserSettingsForm, GameTagsForm, GameEditForm
from .decorators import ajax_login_required
from .utils import get_redis_game_data, set_redis_game_data, create_game_for_redis, del_redis_game, get_game_state

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
    latest_revision = None
    revisions = None
    if not user.is_authenticated():
        magos_b_games = MagosBGame.objects.filter(state=2)
        revisions = Revision.objects.filter(game__in=magos_b_games).order_by('-updated')
    else:
        organization = user.get_profile().organization
        magos_b_games = MagosBGame.objects.filter(author__user__userprofile__organization=organization)
        revisions = Revision.objects.filter(game__in=magos_b_games, game__author__user__userprofile__organization=organization).order_by('-updated')
    if revisions:
        latest_revision = revisions[0]  # get latest revision
    context['latest_revision'] = latest_revision
    context['play_url'] = settings.MAGOS_LITE_PLAY_URL
    if user.is_anonymous():
        ses['username'] = 'anonymous'
        ses['role'] = 'player'
        ses['lang'] = 'english'
        ses['lang_code'] = 'en'
        ses['organization'] = 'magos'
        ses['firstname'] = 'Magos'
        ses['lastname'] = 'Player'

    context['user'] = user
    return render(request, tpl, context)

@login_required
def user_settings(request):
    tpl = 'apps/game/user_settings.html'
    context = RequestContext(request)
    user = request.user
    ses = request.session
    base_url = settings.BASE_URL
    user_settings, created = UserSettings.objects.get_or_create(user=user)
    form = UserSettingsForm(
        request.POST or None,
        instance=user_settings
    )
    password_form = PasswordChangeForm(
        user,
        request.POST or None,
    )
    context['settings_form'] = form
    context['password_form'] = password_form
    if request.is_ajax():
        if request.method == 'POST':
            if form.is_valid():
                form.save()
                use_uppercase_text = form.cleaned_data['use_uppercase_text']
                request.session['use_uppercase_text'] = use_uppercase_text
                request.session.modified = True
                response = {'success' : True, 'base_url': base_url}
            else:
                response = form.errors_as_json()
            return HttpResponse(json.dumps(response, ensure_ascii=False),
                    content_type='application/json')
    return render(request, tpl, context)

@login_required
def delete_game(request, gameslug):
    """Delete game"""
    context = RequestContext(request)
    user = request.user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    else:
        return HttpResponseRedirect(reverse('home'))
    try:
        game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)
        game_title = game.title
        isAuthor = game.author_set.filter(user=user)
        if isAuthor or user == game.creator:
            game.delete()
            messages.success(request, 'Game %s was deleted.' % game_title)
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse('home'))

    return HttpResponseRedirect(reverse('home'))


@login_required
def make_private(request, gameslug):
    """Make game private"""
    return make_public(request, gameslug, private=True)

@login_required
def make_public(request, gameslug, private=False):
    """Make game public"""
    context = RequestContext(request)
    user = request.user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    else:
        return HttpResponseRedirect(reverse('home'))
    try:
        game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)
        game_title = game.title
        isAuthor = game.author_set.filter(user=user)
        if isAuthor or user == game.creator:
            if private:
                game.state = 0
                messages.success(request, 'Game %s is now private.' % game_title)
            else:
                game.state = 2
                messages.success(request, 'Game %s is now public for all.' % game_title)
            game.save()
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse('home'))

    return HttpResponseRedirect(
        reverse('game_details', args=(game.slug,))
    )


@login_required
def edit_game(request, gameslug):
    tpl = 'apps/game/edit_game.html'
    context = RequestContext(request)
    user = request.user
    isAuthor = False
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    else:
        return HttpResponseRedirect(reverse('home'))
    game = None
    try:
        game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)
        isAuthor = game.author_set.filter(user=user)
    except Game.DoesNotExist:
        raise Http404('Game does not exist')

    if isAuthor or user == game.creator:
        if request.method == 'POST':
            form = GameEditForm(request.POST, instance=game)
            if form.is_valid():
                game = form.save()

                # update revision data
                revision = game.get_latest_revision()
                if revision:
                    json_data = json.loads(revision.data)
                    json_data['title'] = game.title
                    revision.data = json.dumps(json_data)
                    revision.save()

                return HttpResponseRedirect(
                    reverse('game_details', args=(game.slug,))
                )
        else:
            form = GameEditForm(instance=game)
        context['game_form'] = form
        return render(request, tpl, context)
    else:
        raise Http404('Game does not exist')


def game_details_id(slug, gameid):
    """
    Redirect to game details via game ID.
    """
    try:
        game = Game.objects.get(id=gameid)
        gameslug = game.slug
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse('home'))
    return redirect('game_details', gameslug=gameslug)


def set_language(request):
    user = request.user
    lang_id = request.POST.get('magos_lang_id' or None)
    url = request.POST.get('next' or None)
    if user.is_authenticated() and lang_id:
        try:
            lang = Language.objects.get(id=lang_id)
            user_profile = user.get_profile()
            if lang and user_profile:
                user_profile.language = lang
                user_profile.save()
                request.session['lang'] = lang.title
                request.session['lang_code'] = lang.code
                request.session['django_language'] = lang.code
                from django.utils import translation
                translation.activate(lang.code)
                request.session.modified = True
                return redirect(url)
        except Language.DoesNotExist:
            pass
    else:
        return HttpResponseRedirect(reverse('home'))

    return HttpResponseRedirect(reverse('home'))

@login_required
def delete_game_image(request, gameslug):
    user = request.user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    else:
        return HttpResponseRedirect(reverse('home'))
    try:
        game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)
        game_title = game.title
        isAuthor = game.author_set.filter(user=user)
        if isAuthor or user == game.creator:
            game.image.delete(save=True)
            messages.success(request, 'Game image was deleted.')
        return redirect('game_details', gameslug=game.slug)
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse('home'))


@login_required
def delete_game_tag(request, gameslug, tagslug):
    user = request.user
    organization = None
    if user.is_authenticated():
        organization = user.get_profile().organization
    else:
        return HttpResponseRedirect(reverse('home'))
    try:
        game = Game.objects.filter(author__user__userprofile__organization=organization).distinct().get(slug=gameslug)
        game_title = game.title
        isAuthor = game.author_set.filter(user=user)
        if isAuthor or user == game.creator:
            try:
                tag = game.tags.get(slug=tagslug)
                game.tags.remove(tag.name)
                messages.success(request, 'Tag was removed.')
            except Tag.DoesNotExist:
                pass
        return redirect('game_details', gameslug=game.slug)
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse('home'))


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
    base_url = settings.BASE_URL
    context['base_url'] = base_url
    editor_url = settings.MAGOS_EDITOR_URL
    play_url = settings.MAGOS_PLAY_URL
    try:
        game = Game.objects.get(slug=gameslug)
        if not user.is_authenticated():
            if not game.state == 2:
                raise Http404('Game does not exist')
            #game = Game.objects.get(slug=gameslug, state=2)
        else:
            if not game.state == 2:
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
        raise Http404('Game does not exist')

    if not game.image:
        image_form = GameImageForm(
            None,
            initial={
                'game_slug': game.slug,
            }
        )
        context['image_form'] = image_form

    tags_form = GameTagsForm()
    context['tags_form'] = tags_form

    if request.POST:
        if 'addGameImage' in request.POST:
            # Image form
            image_form = GameImageForm(
                request.POST,
                request.FILES,
            )
            context['image_form'] = image_form
            if image_form.is_valid():
                game.image = image_form.cleaned_data['image']
                game.save()
                return redirect('game_details', gameslug=game.slug)

        if 'addGameTags' in request.POST:
            # Tags form
            tags_form = GameTagsForm(
                request.POST,
                instance=game,
            )
            context['tags_form'] = tags_form
            if tags_form.is_valid():
                game = tags_form.save()
                #game.image = image_form.cleaned_data['image']
                #game.save()
                return redirect('game_details', gameslug=game.slug)

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
    form = GameForm(organization=organization)
    context['form'] = form
    return render(request, tpl, context)


@ajax_login_required
@json_view
def save_create_game_a(request):
    user = request.user
    organization = user.get_profile().organization
    form = MagosAGameForm(request.POST or None, organization=organization)
    if form.is_valid():
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
        return data

    form_html = render_crispy_form(form)
    return {'success': False, 'form_html': form_html}




"""

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

        json_data = json.dumps(data)
        return HttpResponse(json_data, mimetype='application/json')
    else:
        form = GameForm(organization=organization)
    context['form'] = form
    return render(request, tpl, context)
"""




@ajax_login_required
@json_view
def save_create_game_b(request):
    user = request.user
    organization = user.get_profile().organization
    form = MagosBGameForm(request.POST or None, organization=organization)
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
        sensitivity_data = {
            "jump": 18000,
            "motion": 10000
        }
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
        revision_data['fontColor'] = "#000000"
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
        revision_data['sensitivity'] = sensitivity_data

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
        return data

    form_html = render_crispy_form(form)
    return {'success': False, 'form_html': form_html}


@login_required
def create_game_b(request):
    tpl = 'apps/game/create.html'
    context = RequestContext(request)
    user = request.user
    organization = user.get_profile().organization
    GameForm = MagosBGameForm
    context['gametype_text'] = 'Lite'
    form = GameForm(organization=organization)
    context['form'] = form
    return render(request, tpl, context)


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

    json_data = json.dumps({ 'success': True })
    return HttpResponse(json_data, mimetype='application/json')

@login_required
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

@login_required
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

    json_data = json.dumps({ 'success': True })
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


def ajax_list_games(request, gametype='A', state='public'):
    """
    Get game objects of type A or B (magos-lite).
    :param request: Http request object.
    :param gametype: Game type as string 'A' or 'B'.
    :param state: Game type as string 'all', 'private', 'public' or 'org'.
    """
    game_state = get_game_state(state)
    if not gametype in ['A', 'B']:
        gametype = 'A'
    TypedGame = MagosAGame
    if gametype == 'B':
        TypedGame = MagosBGame
    tpl = 'apps/game/ajax_list_games.html'
    context = RequestContext(request)
    user = request.user
    if user.is_authenticated():
        # authenticated users
        if game_state == 0:
            # list of their own games
            game_ids = user.author_set.all().values_list('game__id', flat=True)
            games = TypedGame.objects.filter(id__in=game_ids)
        elif game_state == 1:
            # their organizatons games
            games = TypedGame.objects.filter(author__user__userprofile__organization=user.userprofile.organization, state__in=[1, 2]).distinct()
        elif game_state == 2:
            # any public game
            games = TypedGame.objects.filter(state=game_state).distinct()

    else:
        # anonymous users get list of public games, state=2
        games = TypedGame.objects.filter(state=2)
    context['games'] = games
    return render(request, tpl, context)


def login_user(request):
    logout(request)
    tpl = 'apps/game/login.html'
    context = RequestContext(request)
    form = LoginForm(request.POST or None)
    next = None
    if request.GET:
        next = request.GET.get('next' or None)
    if request.POST:
        next = request.POST.get('next' or None)
    if next:
        context['next'] = next
    context['login_form'] = form
    if request.POST and form.is_valid():
        user = form.login(request)
        if user:
            if user.is_active:
                login(request, user)
                success_redirect = next or '/'
                return HttpResponseRedirect(success_redirect)
    return render(request, tpl, context)


def logout_user(request):
    logout(request)
    # redirect to home
    return redirect(home)


def register_user(request):
    tpl = 'apps/game/register_user.html'
    context = RequestContext(request)
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        context['register_form'] = form
        if form.is_valid():
            form.save()
            return HttpResponseRedirect('/game/register_success')
    else:
        context['register_form'] = UserRegistrationForm()

    return render(request, tpl, context)

def register_success(request):
    tpl = 'apps/game/register_success.html'
    context = RequestContext(request)
    return render(request, tpl, context)


@staff_member_required
def import_users(request):
    context = RequestContext(request)
    #context['current_app'] = 'user'
    if request.method == "POST":
        form = BatchCreateUsersForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            success = True
            context["form"] = form
            context["success"] = success
            return HttpResponseRedirect("../")
    else:
        form = BatchCreateUsersForm()
        context["form"] = form
        #return HttpResponseRedirect("../")
    return render(request, "admin/auth/user/import_form.html", context)
