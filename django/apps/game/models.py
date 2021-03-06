from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.utils.translation import ugettext_lazy as _
from audiofield.fields import AudioField
import datetime, mimetypes, hashlib, time
from unidecode import unidecode
from autoslug import AutoSlugField
from imagekit.models import ImageSpecField
from django.conf import settings
from polymorphic import PolymorphicModel
from django.db import models, IntegrityError, transaction

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.template.defaultfilters import slugify
from taggit.managers import TaggableManager

from taggit.managers import TaggableManager
from taggit.models import TagBase, GenericTaggedItemBase

try:
    atomic = transaction.atomic
except AttributeError:
    from contextlib import contextmanager

    @contextmanager
    def atomic(using=None):
        sid = transaction.savepoint(using=using)
        try:
            yield
        except IntegrityError:
            transaction.savepoint_rollback(sid, using=using)
            raise
        else:
            transaction.savepoint_commit(sid, using=using)

class MagosTag(TagBase):
    """
    Custom tag class for django-taggit
    """
    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")

    def save(self, *args, **kwargs):
        # This is already fixed in trunk of django-taggit
        # Remove when updating django-taggit
        if not self.pk and not self.slug:
            self.slug = self.slugify(self.name)
            from django.db import router
            using = kwargs.get("using") or router.db_for_write(
                type(self), instance=self)
            # Make sure we write to the same db for all attempted writes,
            # with a multi-master setup, theoretically we could try to
            # write and rollback on different DBs
            kwargs["using"] = using
            # Be oportunistic and try to save the tag, this should work for
            # most cases ;)
            try:
                with atomic(using=using):
                    res = super(MagosTag, self).save(*args, **kwargs)
                return res
            except IntegrityError:
                pass
            # Now try to find existing slugs with similar names
            slugs = set(MagosTag.objects.filter(slug__startswith=self.slug)\
                                   .values_list('slug', flat=True))
            i = 1
            while True:
                slug = self.slugify(self.name, i)
                if slug not in slugs:
                    self.slug = slug
                    # We purposely ignore concurrecny issues here for now.
                    # (That is, till we found a nice solution...)
                    return super(MagosTag, self).save(*args, **kwargs)
                i += 1
        else:
            return super(MagosTag, self).save(*args, **kwargs)

    def slugify(self, tag, i=None):
        slug = slugify(unidecode(tag))
        if i is not None:
            slug += "_%d" % i
        return slug


class MagosTaggedKeys(GenericTaggedItemBase):
    tag = models.ForeignKey(MagosTag, related_name="%(app_label)s_%(class)s_items")


# Game block sizes (32, 48, 64)
BLOCK_SIZE_CHOICES = (
    (32, _(u'32 pixels')),
    (48, _(u'48 pixels')),
    (64, _(u'64 pixels')),
)

CONST_DEFAULT_BLOCK_SIZE = 65536 # 64k

# add AudioField introspection rules for South
rules = [
        (
        (AudioField, ),
        [],
        {
            "ext_whitelist": ["ext_whitelist", {"default": None}],
        },
    ),
]
from south.modelsinspector import add_introspection_rules
add_introspection_rules(rules, ["^audiofield.fields.AudioField",])

import uuid, os
def get_image_path(instance, filename):
    """
    Come up with individual name for uploaded image file and return path.
    """
    #import ipdb;ipdb.set_trace()
    ext = filename.split('.')[-1]
    image_uuid = uuid.uuid4()
    instance.image_uuid = image_uuid
    filename = "%s.%s" % (image_uuid, ext)
    return os.path.join(settings.USER_MEDIA_PREFIX, filename)

def get_image_ext(instance, filename):
    """
    Get extension of uploaded image file.
    """
    #import ipdb;ipdb.set_trace()
    ext = filename.split('.')[-1]
    return ext

def get_thumb_path(instance, filename):
    """
    Come up with individual name for thumbnail image file.
    """
    #import ipdb;ipdb.set_trace()
    orig_path = instance.original.image_file.name.split('/')[-1]
    image_name, ext = orig_path.split('.')
    filename = image_name + '_' + str(instance.width) + 'x' + str(instance.height) + '.' + ext

    return os.path.join(settings.USER_MEDIA_PREFIX + 'thumbs/', filename)
    

def timestamp():
   now = time.time()
   localtime = time.localtime(now)
   milliseconds = '%03d' % int((now - int(now)) * 1000)
   return time.strftime('%Y%m%d%H%M%S', localtime) + milliseconds


""" Model definitions -> """

class ContentFileType(models.Model):
    """Content type for ContentFile."""
    main_type = models.CharField(max_length=16, db_index=True)
    sub_type = models.CharField(max_length=128, db_index=True)

    class Meta:
        """Meta class for ContentFileType."""
        unique_together = (("main_type", "sub_type"),)

    def __unicode__(self):
        """String representation of the data."""
        return u'%s/%s' % (self.main_type, self.sub_type)


class Role(models.Model):
    """User role model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    permission_level = models.IntegerField()

    class Meta:
        verbose_name = _('role')
        verbose_name_plural = _('roles')

    def __unicode__(self):
        return self.name


class Language(models.Model):
    """Language model"""
    title = models.CharField(max_length=45, null=False, blank=False)
    slug = AutoSlugField(
        populate_from=lambda instance: instance.title,
        unique_with=['title', 'code'],
        slugify=lambda value: unidecode(value)
    )
    code = models.CharField(max_length=2, null=False, blank=False)

    class Meta:
        verbose_name = _('language')
        verbose_name_plural = _('languages')
        unique_together = (('title','slug', 'code'),)

    def __unicode__(self):
        return self.title


class Country(models.Model):
    """Country model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    #slug = models.SlugField(max_length=45, null=False, blank=False)
    slug = AutoSlugField(
        populate_from=lambda instance: instance.name,
        unique_with=['name'],
        slugify=lambda value: unidecode(value)
    )

    class Meta:
        verbose_name = _('country')
        verbose_name_plural = _('countries')
        unique_together = (('name','slug',),)
        #db_table = 'countries'

    def __unicode__(self):
        return self.name

from django.core.exceptions import ValidationError

def validate_only_one_public(obj):
    # limit public organizations to one
    model = obj.__class__
    if (model.objects.filter(public_org=True).count() > 0 and obj.id != model.objects.get(public_org=True).id):
        raise ValidationError("Only one %s can be public" % model.__name__)


class Organization(models.Model):
    """Organization model"""
    name = models.CharField(max_length=100, null=False, blank=False)
    slug = models.SlugField(max_length=100, null=False, blank=False, unique=True)
    country = models.ForeignKey(Country)
    language = models.ForeignKey(Language)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True)

    public_org = models.BooleanField(null=False, blank=False, default=False) # only one organization can be public

    org_uuid = models.CharField(max_length=36, null=True, blank=True, unique=True)

    def save(self, *args, **kwargs):
        if not self.org_uuid:
            # generate uuid if one does not exist
            self.org_uuid = self.get_org_uuid()
        super(Organization, self).save(*args, **kwargs)

    def get_org_uuid(self):
        """
        Generate semirangom 8 alphanumeric hash beginning with 
        first two letters from organization slug name.
        """
        return self.slug[:2] + str(uuid.uuid4())[:6]

    class Meta:
        verbose_name = _('organization')
        verbose_name_plural = _('organizations')

    def clean(self):
        if(self.public_org):
            validate_only_one_public(self)

    def __unicode__(self):
        return self.name
        
class Disability(models.Model):
    """Disability model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    description = models.TextField(null=False, blank=False)
 
    class Meta:
        verbose_name = _('disability')
        verbose_name_plural = _('disabilities')

    def __unicode__(self):
        return self.name


class GameType(models.Model):
    """Game type model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, unique=True, null=False, blank=False)
 
    class Meta:
        verbose_name = _('game type')
        verbose_name_plural = _('game types')
        #db_table = 'game_types'

    def __unicode__(self):
        return self.name


class Achievement(models.Model):
    """Achievement model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    points = models.IntegerField(null=False, blank=False)
    image = models.CharField(max_length=100, null=True, blank=True)
    users = models.ManyToManyField(User, through='AchievementMembership')

    class Meta:
        verbose_name = _('achievement')
        verbose_name_plural = _('achievements')

    def __unicode__(self):
        return self.name


class AchievementMembership(models.Model):
    user = models.ForeignKey(User)
    achievement = models.ForeignKey(Achievement)
    created = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        unique_together = (('user','achievement'),)
        verbose_name = _('user has achievement')
        verbose_name_plural = _('user has achievement')

    def __unicode__(self):
        return u"%s, %s" % (self.user, self.achievement)


class Gender(models.Model):
    """Gender model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    abbr = models.CharField(max_length=1, null=False, blank=False, default='M')

    class Meta:
        unique_together = (('name','abbr'),)
        verbose_name = _('gender')
        verbose_name_plural = _('genders')

    def __unicode__(self):
        return u"%s" % (self.name)


class UserProfile(models.Model):
    """User profile model. This expands User model of Django."""
    user = models.OneToOneField(User, primary_key=True)
    organization = models.ForeignKey(Organization)
    year_of_birth = models.IntegerField(null=True, blank=True)
    grade = models.IntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    group = models.BooleanField(null=False, blank=False, default=False)
    language = models.ForeignKey(Language)
    role = models.ForeignKey(Role)
    disability = models.ForeignKey(Disability, null=True, blank=True)
    country = models.ForeignKey(Country, null=True, blank=True)
    updated = models.DateTimeField(auto_now=True)
    gender = models.ForeignKey(Gender, null=True, blank=True)

    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')

    def __unicode__(self):
        return u"%s's profile" % self.user

        
class Image(models.Model):
    """Model for square game tile images"""
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    width = models.IntegerField(null=False, blank=False)
    height = models.IntegerField(null=False, blank=False)
    image_file = models.ImageField(upload_to=get_image_path, height_field='height', width_field='width')
    image_uuid = models.CharField(max_length=36, null=True, blank=True)
    
    sha1 = models.CharField(max_length=40, editable=False, db_index=True)
    content_type = models.ForeignKey('ContentFileType', blank=True, null=True)
    
    image_type = models.PositiveIntegerField(null=False, blank=False, default=0)
    state = models.PositiveIntegerField(null=False, blank=False, default=0)
    author = models.ForeignKey(User)
    
    cloned = models.ForeignKey(
        'self', 
        blank=True, 
        null=True, 
        help_text="Cloned image",
        related_name="cloned_image_set"
    )

    created = models.DateTimeField(auto_now_add=True, default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        #import ipdb; ipdb.set_trace()
        if not self.slug:
            self.slug = slugify(self.name)
        self.image_file.open('rb') # returns nothing
        content = self.image_file
        
        hashgen = hashlib.sha1()
        while True:
            chunk = content.read(CONST_DEFAULT_BLOCK_SIZE)
            if not chunk:
                break
            hashgen.update(chunk)

        hash_digest = hashgen.hexdigest()
        self.sha1 = hash_digest
        
        #import ipdb;ipdb.set_trace()
        # analyze content (mime) type
        # this relies on temporary files written on disk
        filename = self.image_file.file.temporary_file_path()
        from apps.game.utils import get_mime_type
        (main_type, sub_type) = get_mime_type(filename)
        # if needed, add new content type to db
        content_file_type, created = ContentFileType.objects.get_or_create(\
            main_type=main_type, sub_type=sub_type)
        self.content_type = content_file_type
        """
        if main_type == 'image':
            # this is an image, set meta information
            set_image_metas(filename, self)
        """
        super(Image, self).save(*args, **kwargs)


    @property
    def image_url( self ):
        try:
            # would be better to use python-magic for mimetype?
            mimetype, encoding = mimetypes.guess_type(self.image_file.name)
            img = open( self.image_file.path, "rb")
            data = img.read()
            return "data:%s;base64,%s" % (mimetype, data.encode('base64'))
        except IOError:
            return self.image_file.url

    class Meta:
        verbose_name = _('image')
        verbose_name_plural = _('images')

    def __unicode__(self):
        return u"%s" % self.name


class Audio(models.Model):
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    #file = models.FileField(upload_to='audio')
    file = AudioField(upload_to='audio', blank=True, ext_whitelist=(".mp3", ".wav", ".ogg"), help_text=("Allowed type - .mp3, .wav, .ogg")) #Django-audiofield
    state = models.IntegerField(null=False, blank=False, default=0)
    author = models.ForeignKey(User)
    
    cloned = models.ForeignKey(
        'self', 
        blank=True, 
        null=True, 
        help_text="Cloned audio file",
        related_name="cloned_audio_set"
    )

    created = models.DateTimeField(auto_now_add=True, default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)

    @property
    def audio_url( self ):
        try:
            # would be better to use python-magic for mimetype?
            mimetype, encoding = mimetypes.guess_type(self.file.name)
            img = open( self.file.path, "rb")
            data = img.read()
            return "data:%s;base64,%s" % (mimetype, data.encode('base64'))
        except IOError:
            return self.file.url
    
    def audio_file_player(self):
        """audio player tag for admin"""
        if self.audio_file:
            file_url = settings.MEDIA_URL + str(self.audio_file)
            player_string = '<ul class="playlist"><li style="width:250px;">\
            <a href="%s">%s</a></li></ul>' % (file_url, os.path.basename(self.audio_file.name))
            return player_string

    audio_file_player.allow_tags = True
    audio_file_player.short_description = _('Audio file player')

    class Meta:
        verbose_name = _('audio')
        verbose_name_plural = _('audios')

    def __unicode__(self):
        return u"%s" % self.name


class Game(PolymorphicModel):
    title = models.CharField(
        max_length=45, 
        verbose_name=_(u'title'),
        null=False, 
        blank=False
    )
    slug = models.SlugField(
        max_length=45, 
        verbose_name=_(u'slug'),
        null=False, 
        blank=False, 
        unique=True
    )
    state = models.IntegerField(
        verbose_name=_(u'state'),
        null=False, 
        blank=False, 
        default=0
    )
    image = models.ImageField(
        verbose_name=_(u'image'),
        blank = True, 
        null = True, 
        upload_to='game_images'
    )
    description = models.CharField(
        verbose_name=_(u'description'),
        max_length=255, 
        null=True, 
        blank=True
    )
    cloned = models.IntegerField(
        verbose_name=_(u'cloned'),
        null=True, 
        blank=True
    )
    created = models.DateTimeField(
        verbose_name=_(u'created'),
        auto_now_add=True, 
        default=datetime.date.today
    )
    updated = models.DateTimeField(
        verbose_name=_(u'updated'),
        auto_now=True
    )
    creator = models.ForeignKey(
        User, 
        verbose_name=_(u'creator'),
        blank = True, 
        null = True
    )
    tags = TaggableManager(through=MagosTaggedKeys, blank=True)

    class Meta:
        verbose_name = _('game')
        verbose_name_plural = _('games')

    def get_latest_revision(self):
        return Revision.objects.filter(game=self).latest('inserted')

    def state_as_text(self):
        msg = _(u'private')
        if self.state == 1:
            msg = _(u'public for your organization')
        elif self.state == 2:
            msg = _(u'public for all')
        return msg

    def is_private(self):
        return (self.state == 0)

    def is_public(self):
        return (self.state == 1 or self.state == 2)

    def __unicode__(self):
        return u"%s" % self.title


class MagosAGame(Game):
    """
    A-type Game
    """
    type = models.ForeignKey(GameType)
    rows = models.IntegerField(null=False, blank=False, default=0)
    cols = models.IntegerField(null=False, blank=False, default=0)
    block_size = models.IntegerField(null=False, blank=False, choices=BLOCK_SIZE_CHOICES, default=32)

    class Meta:
        verbose_name = _(u'Magos A game')
        verbose_name_plural = _(u'Magos A games')

    def __unicode__(self):
        return u'%s' % (self.title)


class MagosBGame(Game):
    """
    B-type Game
    """

    class Meta:
        verbose_name = _(u'Magos B game')
        verbose_name_plural = _(u'Magos B games')

    def __unicode__(self):
        return u'%s' % (self.title)


class Revision(models.Model):
    """Game revision model"""
    game = models.ForeignKey(Game)
    inserted = models.DateTimeField(auto_now_add=True,default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)
    data = models.TextField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('revision')
        verbose_name_plural = _('revisions')
    
    def get_latest_revision(self, game):
        return self.objects.filter(game=game).latest('inserted')
        
    def __unicode__(self):
        return u"%s (revision %s)" % (self.game, self.inserted)


class Highscore(models.Model):
    """Highscore model"""
    user = models.ForeignKey(User)
    game = models.ForeignKey(Revision)
    score = models.IntegerField(null=False, blank=False, default=0)
    
    class Meta:
        verbose_name = _('highscore')
        verbose_name_plural = _('highscores')

    def __unicode__(self):
        return u"%s, %s, %s" % (self.game, self.user, self.score)
        
        
class Review(models.Model):
    """Review model"""
    user = models.ForeignKey(User)
    game = models.ForeignKey(Game)
    stars = models.IntegerField(null=True, blank=True)
    comment = models.CharField(max_length=255, null=True, blank=True)
    inserted = models.DateTimeField(auto_now_add=True,default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = (('user','game'),)
        verbose_name = _('review')
        verbose_name_plural = _('reviews')

    def __unicode__(self):
        return u"%s, %s" % (self.game, self.user)

        
class Author(models.Model):
    """Author model"""
    user = models.ForeignKey(User)
    game = models.ForeignKey(Game)
    inserted = models.DateTimeField(auto_now_add=True,default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = (('user','game'),)
        verbose_name = _('author')
        verbose_name_plural = _('authors')

    def __unicode__(self):
        return u"%s, %s" % (self.game, self.user)


class Thumbnail(models.Model):
    """Thumbnail class for images."""
    thumbnail = models.ImageField(upload_to=get_thumb_path, height_field='height', width_field='width')
    original = models.ForeignKey('Image')
    width = models.IntegerField()
    height = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True, editable=False)

    def __unicode__(self):
        """String representation of the data."""
        return u'%s created:%s' % \
                (self.thumbnail.name, self.created)

    def create_thumbnail(self):
        """Creates a thumbnail."""
        # resize original image into temporary file
        from apps.game.utils import make_thumbnail
        try:
            tn_file = make_thumbnail(self.original.image_file.file.name, int(self.width), int(self.height))
            if tn_file:
                # now move the temporary data into thumbnail storage
                self.thumbnail.save(self._gen_filename(), tn_file)
                # we don't need temporary file anymore
                os.unlink(tn_file.name)
                return True
        except IOError, err:
            print ("IOError when trying to create thumbnail: %s" % err)
        return False

    def get_or_create_thumbnail(self):
        """Get or create thumbnail if it does not exist."""
        #import ipdb;ipdb.set_trace()
        #thumbs = Thumbnail.objects.filter(original=self.original, width=self.width, height=self.height)
        #if len(thumbs) == 0:
        if not self.thumbnail.name or not self.thumbnail.storage.exists(self.thumbnail.name):
            # create the thumbnail
            if self.create_thumbnail():
                self.save()
            else:
                return False
        # get the thumbnail
        return self.thumbnail

    def _gen_filename(self):
        """Generate filename with thumbnail dimensions."""
        image_name, ext = self.original.image_file.name.split('.')
        return '%s_%sx%s.%s' % (image_name, self.width, self.height, ext)


class UserSettings(models.Model):
    """Model to store user settings"""
    user = models.OneToOneField(User)
    use_uppercase_text = models.BooleanField(default=False)

    created = models.DateTimeField(auto_now_add=True,default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('user settings')
        verbose_name_plural = _('user settings')

    def __unicode__(self):
        return u"settings of %s" % (self.user)


"""
Signals functions
"""

def create_user_profile(sender, instance, created, **kwargs):
    profile = None
    default_country, country_created = Country.objects.get_or_create(name='Suomi', slug='finland')
    default_lang = None
    lang_created = False
    #default_lang, lang_created = Language.objects.get_or_create(code='fi', slug='suomi', title='suomi')
    default_lang = Language.objects.filter(code='fi', slug='suomi')
    if default_lang:
        default_lang = default_lang[0]
    else:
        default_lang = Language.objects.create(code='fi', slug='suomi', title='suomi')
        lang_created = True

    default_role, role_created = Role.objects.get_or_create(name='student', permission_level=1)
    #default_organization, organization_created = Organization.objects.get_or_create(name='TTY', slug='tty', language=default_lang, country=default_country)
    default_organization = None
    organization_created = False
    default_organization = Organization.objects.filter(slug='tty')
    if default_organization:
        default_organization = default_organization[0]
    else:
        default_organization = Organization.objects.create(name='TTY', slug='tty', language=default_lang, country=default_country)
        organization_created = True

    default_gender = None
    try:
        default_gender = Gender.objects.get(abbr='M')
    except Gender.DoesNotExist:
        pass
    #default_gender, gender_created = Gender.objects.get_or_create(name='male', abbr='M')

    if created:
        try:
            profile, created = UserProfile.objects.get(user=instance)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user = instance, language=default_lang, role=default_role, organization=default_organization, gender=default_gender)
            profile.save()
    else:
        try:
            profile = instance.get_profile()
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user = instance, language=default_lang, role=default_role, organization=default_organization, gender=default_gender)
            profile.save()

# Automagically create a profile when user is created
post_save.connect(create_user_profile, sender=User)

@receiver(pre_save)
def slugify_title_callback(sender, instance, *args, **kwargs):
    # TODO: We can't do it this way, game slug should not be edited!
    if hasattr(instance, 'title') and hasattr(instance, 'slug'):
        instance.slug = slugify(unidecode(instance.title))


# store additonal user info when user logs in
from django.contrib.auth.signals import user_logged_in

def store_info_to_session(sender, user, request, **kwargs):
    #print request.user.userprofile.language.code
    lang_code = request.user.userprofile.language.code
    try:
        user_settings = UserSettings.objects.get(user=request.user)
        use_uppercase_text = user_settings.use_uppercase_text 
    except UserSettings.DoesNotExist:
        use_uppercase_text = False
    request.session['username'] = request.user.username
    request.session['role'] = request.user.userprofile.role.name
    request.session['lang'] = request.user.userprofile.language.slug
    request.session['lang_code'] = lang_code
    request.session['organization'] = request.user.userprofile.organization.slug
    request.session['firstname'] = request.user.first_name
    request.session['lastname'] = request.user.last_name
    request.session['use_uppercase_text'] = use_uppercase_text

    request.session['django_language'] = lang_code
    from django.utils import translation
    translation.activate(lang_code)

    
user_logged_in.connect(store_info_to_session)
