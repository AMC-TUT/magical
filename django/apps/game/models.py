from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.utils.translation import ugettext_lazy as _
import datetime

class Language(models.Model):
    """Language model"""
    title = models.CharField(max_length=45)
    slug = models.SlugField(max_length=45, unique=True)
    code = models.CharField(max_length=2)

    class Meta:
        verbose_name = _('language')
        verbose_name_plural = _('languages')

    def __unicode__(self):
        return self.title


class Country(models.Model):
    """Country model"""
    name = models.CharField(max_length=45)
    slug = models.SlugField(max_length=45)

    class Meta:
        verbose_name = _('country')
        verbose_name_plural = _('countries')
        #db_table = 'countries'

    def __unicode__(self):
        return self.name

class GameType(models.Model):
    """Game type model"""
    name = models.CharField(max_length=45)
    slug = models.SlugField(max_length=45)
 
    class Meta:
        verbose_name = _('game type')
        verbose_name_plural = _('game types')
        #db_table = 'game_types'

    def __unicode__(self):
        return self.name


class UserProfile(models.Model):
    """User profile model. This expands User model of Django."""
    user = models.OneToOneField(User, primary_key=True)

    year_of_birth = models.IntegerField(null=True, blank=True)
    grade = models.IntegerField(null=True, blank=True)
    language = models.ForeignKey(Language, default=Language.objects.get(code='fi').id)

    #created = models.DateTimeField(auto_now_add=True,default=datetime.date.today)
    modified = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')
        #db_table = 'user_profiles'

    def __unicode__(self):
        return "%s's profile" % self.user

    
def create_user_profile(sender, instance, created, **kwargs):
    profile = None
    if created:
       profile, created = UserProfile.objects.get_or_create(user=instance)  
    else:
        try:
            profile = instance.get_profile()
	except UserProfile.DoesNotExist:
	    profile = UserProfile.objects.create(user = instance)
        profile.save()

# Automagically create a profile when user is created
post_save.connect(create_user_profile, sender=User) 

  
