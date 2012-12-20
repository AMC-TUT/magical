from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.utils.translation import ugettext_lazy as _
from audiofield.fields import AudioField
import datetime, mimetypes, hashlib, time
from imagekit.models import ImageSpecField

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
    ext = filename.split('.')[-1]
    filename = "%s.%s" % (uuid.uuid4(), ext)
    return os.path.join('user-media/images', filename)


def timestamp():
   now = time.time()
   localtime = time.localtime(now)
   milliseconds = '%03d' % int((now - int(now)) * 1000)
   return time.strftime('%Y%m%d%H%M%S', localtime) + milliseconds


""" Model definitions -> """

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
    slug = models.SlugField(max_length=45, unique=True, null=False, blank=False)
    code = models.CharField(max_length=2, null=False, blank=False)

    class Meta:
        verbose_name = _('language')
        verbose_name_plural = _('languages')

    def __unicode__(self):
        return self.title


class Country(models.Model):
    """Country model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False)

    class Meta:
        verbose_name = _('country')
        verbose_name_plural = _('countries')
        #db_table = 'countries'

    def __unicode__(self):
        return self.name

class Organization(models.Model):
    """Organization model"""
    name = models.CharField(max_length=100, null=False, blank=False)
    slug = models.SlugField(max_length=100, null=False, blank=False, unique=True)
    country = models.ForeignKey(Country)
    language = models.ForeignKey(Language)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('organization')
        verbose_name_plural = _('organizations')

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
        verbose_name = _('gender')
        verbose_name_plural = _('genders')
    
    @classmethod
    def get_default_gender(cls):
        default_gender, created = Gender.objects.get_or_create(name='male', abbr='M')
        return default_gender

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
    gender = models.ForeignKey(Gender, default=Gender.get_default_gender)
    #gender = models.ForeignKey(Gender, null=True, blank=True)

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

    #file = models.ImageField(storage=FILESTORAGE, height_field='height', width_field='width', upload_to=get_path)
    #sha1 = models.CharField(max_length=40, editable=False, db_index=True, blank=False, null=False, unique=True, default=timestamp)
    sha1 = models.CharField(max_length=40, editable=False, db_index=True)

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
        print hash_digest
        self.sha1 = hash_digest
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

        
class Game(models.Model):
    """Game model"""
    # Game block sizes (32, 48, 64)
    BLOCK_SIZE_CHOICES = (
        (32, '32 pixels'),
        (48, '48 pixels'),
        (64, '64 pixels'),
    )

    title = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    type = models.ForeignKey(GameType)
    state = models.IntegerField(null=False, blank=False, default=0)
    image = models.ImageField(blank = True, null = True, upload_to='game_images')
    description = models.CharField(max_length=255, null=True, blank=True)
    cloned = models.IntegerField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)

    rows = models.IntegerField(null=False, blank=False, default=0)
    cols = models.IntegerField(null=False, blank=False, default=0)
    block_size = models.IntegerField(null=False, blank=False, choices=BLOCK_SIZE_CHOICES, default=32)
    #organization = models.ForeignKey(Organization)

    class Meta:
        verbose_name = _('game')
        verbose_name_plural = _('games')

    def get_latest_revision(self):
        return Revision.objects.filter(game=self).latest('inserted')
    
    def __unicode__(self):
        return u"%s" % self.title

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



"""
Signals functions
"""

        
def create_user_profile(sender, instance, created, **kwargs):
    profile = None
    default_country, country_created = Country.objects.get_or_create(name='Suomi', slug='finland')
    default_lang, lang_created = Language.objects.get_or_create(code='fi', title='suomi', slug='finnish')
    default_role, role_created = Role.objects.get_or_create(name='student', permission_level=1)
    default_organization, organization_created = Organization.objects.get_or_create(name='TTY', slug='tty', language=default_lang, country=default_country)
    default_gender, gender_created = Gender.objects.get_or_create(name='male', abbr='M')

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

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.template.defaultfilters import slugify

@receiver(pre_save)
def slugify_title_callback(sender, instance, *args, **kwargs):
    # TODO: We can't do it this way, game slug should not be edited!
    if hasattr(instance, 'title') and hasattr(instance, 'slug'):
        instance.slug = slugify(instance.title)


# store additonal user info when user logs in
from django.contrib.auth.signals import user_logged_in

def store_info_to_session(sender, user, request, **kwargs):
    #print request.session.load()
    request.session['username'] = request.user.username
    request.session['role'] = request.user.userprofile.role.name
    request.session['lang'] = request.user.userprofile.language.slug
    request.session['organization'] = request.user.userprofile.organization.slug
    request.session['firstname'] = request.user.first_name
    request.session['lastname'] = request.user.last_name

user_logged_in.connect(store_info_to_session)
