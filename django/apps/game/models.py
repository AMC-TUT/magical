from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.utils.translation import ugettext_lazy as _
import datetime
#from apps.game.signals import create_user_profile

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
    users = models.ManyToManyField(User, through='OrganizationMembership')

    class Meta:
        verbose_name = _('organization')
        verbose_name_plural = _('organizations')

    def __unicode__(self):
        return self.name

class OrganizationMembership(models.Model):
    user = models.ForeignKey(User)
    organization = models.ForeignKey(Organization)

    class Meta:
        unique_together = (('user','organization'),)
        verbose_name = _('organization has user')
        verbose_name_plural = _('organization has users')

    def __unicode__(self):
        return u"%s, %s" % (self.organization, self.user)

        
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

        
class UserProfile(models.Model):
    """User profile model. This expands User model of Django."""
    user = models.OneToOneField(User, primary_key=True)

    year_of_birth = models.IntegerField(null=True, blank=True)
    grade = models.IntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    group = models.BooleanField(null=False, blank=False, default=False)
    language = models.ForeignKey(Language)
    role = models.ForeignKey(Role)
    disability = models.ForeignKey(Disability, null=True, blank=True)
    country = models.ForeignKey(Country, null=True, blank=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')

    def __unicode__(self):
        return u"%s's profile" % self.user

        
class Image(models.Model):
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    width = models.IntegerField(null=False, blank=False)
    height = models.IntegerField(null=False, blank=False)
    file = models.ImageField(upload_to='images', height_field='height', width_field='width')
    type = models.IntegerField(null=False, blank=False, default=0)
    state = models.IntegerField(null=False, blank=False, default=0)
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
    
    class Meta:
        verbose_name = _('image')
        verbose_name_plural = _('images')

    def __unicode__(self):
        return u"%s" % self.name


class Audio(models.Model):
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    file = models.FileField(upload_to='audio')
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
    
    class Meta:
        verbose_name = _('audio')
        verbose_name_plural = _('audios')

    def __unicode__(self):
        return u"%s" % self.name

        
class Game(models.Model):
    """Game model"""
    title = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, null=False, blank=False, unique=True)
    type = models.ForeignKey(GameType)
    state = models.IntegerField(null=False, blank=False, default=0)
    image = models.CharField(max_length=100, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    cloned = models.IntegerField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, default=datetime.date.today)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('game')
        verbose_name_plural = _('games')

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

    def __unicode__(self):
        return u"%s (revision %s)" % (self.game, self.inserted)

    
        
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

        
def create_user_profile(sender, instance, created, **kwargs):
    profile = None
    default_lang, lang_created = Language.objects.get_or_create(code='fi', title='suomi', slug='finnish')
    default_role, role_created = Role.objects.get_or_create(name='student', permission_level=1)
    
    if created:
        try:
            profile, created = UserProfile.objects.get(user=instance)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user = instance, language=default_lang, role=default_role)
            profile.save()
    else:
        try:
            profile = instance.get_profile()
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user = instance, language=default_lang, role=default_role)
            profile.save()

# Automagically create a profile when user is created
post_save.connect(create_user_profile, sender=User)
