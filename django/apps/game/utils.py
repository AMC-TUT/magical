from django.core.files import File
import re, tempfile, magic, json
from PIL import Image
from redis import Redis
from django.conf import settings
from apps.game.models import Game

def make_thumbnail(original, width, height):
    """Resizes images, used in thumbnail creation.
       Returns File object from created temporary file."""
    try:
        
        image = Image.open(original)
        image.thumbnail([width, height], Image.ANTIALIAS)
        tmp_file = tempfile.mkstemp('magos_tn')
        target_format = image.format
        try:
            if image.format == 'GIF':
                image.save(tmp_file[1], target_format, quality=90)
            else:
                image.save(tmp_file[1], target_format, quality=90, optimize=1)
        except:
            image.save(tmp_file[1], target_format, quality=90)
        print ("thumbnail created from %s (%dx%d)" % (original, width, height))
        return File(open(tmp_file[1], 'rb'))
    except Exception, err:
        print ("Could not create a %dx%d thumbnail from image: '%s': %s" % (width, height, original, err))

def get_mime_type(filename):
    """
    Get file mime type as tuple of main and sub type.
    """

    if hasattr(magic, 'from_file'):
        # new magic library
        mime_type = magic.from_file(filename, mime=True)

    elif hasattr(magic, 'open'):
        # old magic library
        m_cookie = magic.open(magic.MAGIC_MIME)
        m_cookie.load()
        mime_type = m_cookie.file(filename)
        m_cookie.close()

    if mime_type:
        mime_type_parts = mime_type.split(";")[0].split()[0]
        mime_type_parts = mime_type_parts.split('/')
        main_type = mime_type_parts[0]
        sub_type = ''
        if len(mime_type_parts) > 1 and len(mime_type_parts[1]):
            sub_type = mime_type_parts[1]
        return (main_type, sub_type)
    return (u'application', u'octet-stream') # this is the default

def create_game_for_redis(gameslug):
    """Create game data as dict ready for Redis."""
    game = None
    result_dict = {}
    try:
        game = Game.objects.get(slug=gameslug)
    except Game.DoesNotExist:
        pass

    if game:
        result_dict['title'] = game.title
        result_dict['id'] = game.id
        if hasattr(game, "type"):
            result_dict['type'] = game.type.name
        result_dict['state'] = game.state
        result_dict['description'] = game.description
        result_dict['cloned'] = game.cloned
        # get game authors and organization
        authors = game.author_set.all()
        authors_list = []
        organization = None
        if authors:
            organization = authors[0].user.userprofile.organization.name # organization (=author's organization)
        for author in authors:
            author_dict = {}
            author_dict['firstName'] = author.user.first_name
            author_dict['lastName'] = author.user.last_name
            author_dict['userName'] = author.user.username
            authors_list.append(author_dict)

        result_dict['authors'] = authors_list
        result_dict['organization'] = organization

        revision = game.get_latest_revision()
        revision_dict = {}
        if revision:
            revision_dict['data'] = revision.data

        json_data = ""
        try:
            json_data = json.loads(revision.data)
        except ValueError:
            pass
        result_dict['revision'] = json_data
    
    return result_dict


def init_redis():
    redis_db = Redis(
        host=getattr(settings, 'SESSION_REDIS_HOST', 'localhost'),
        port=getattr(settings, 'SESSION_REDIS_PORT', 6379),
        db=getattr(settings, 'SESSION_REDIS_DB', 0),
        password=getattr(settings, 'SESSION_REDIS_PASSWORD', None)
    )
    return redis_db

def get_redis_game_data(gameslug):
    redis_db = init_redis()
    prefix = getattr(settings, 'GAME_REDIS_PREFIX', '')
    game_key = ':'.join([prefix, gameslug])
    data = redis_db.get(game_key)
    return data

def set_redis_game_data(gameslug, data):
    redis_db = init_redis()
    prefix = getattr(settings, 'GAME_REDIS_PREFIX', '')
    game_key = ':'.join([prefix, gameslug])
    data = redis_db.set(game_key, data)
    return True

def del_redis_game(gameslug):
    redis_db = init_redis()
    prefix = getattr(settings, 'GAME_REDIS_PREFIX', '')
    game_key = ':'.join([prefix, gameslug])
    redis_db.delete(game_key)
    return True

def get_game_state(state_str):
    """
    Get game state as integer.
    0 = private
    1 = public for organization
    2 = public for all
    :param state: Game type as string 'private', 'org' or public'.
    """
    state = 0
    if state_str == 'org':
        state = 1
    if state_str == 'public':
        state = 2
    return state
