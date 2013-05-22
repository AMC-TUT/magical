from django.core.files import File
import re, tempfile, Image, magic
from redis import Redis
from django.conf import settings

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
       apps.content.utils.get_mime_type uses python magic library to
       tell what mime type a file actually has.

       We cannot trust the mime type given during
       browser uploading.

       * About MIME types: http://tools.ietf.org/html/rfc2046
       * List of MIME types: http://www.iana.org/assignments/media-types/

       :arg filename: Filename of the file of which mime type \
               you want to find out
       :type filename: str

       :returns: tuple of main and sub type.
       :rtype: tuple
       """
    #import ipdb;ipdb.set_trace()

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
    """
    redis_db = Redis(
        host=getattr(settings, 'SESSION_REDIS_HOST', 'localhost'),
        port=getattr(settings, 'SESSION_REDIS_PORT', 6379),
        db=getattr(settings, 'SESSION_REDIS_DB', 0),
        password=getattr(settings, 'SESSION_REDIS_PASSWORD', None)
    )
    """
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

