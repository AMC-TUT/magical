from django.db import models
from apps.game.models import Organization
from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _

class WordType(models.Model):
    """Word type model"""
    name = models.CharField(max_length=45, null=False, blank=False)

    class Meta:
        verbose_name = _('word type')
        verbose_name_plural = _('word types')

    def __unicode__(self):
        return self.name


class List(models.Model):
    """List model"""
    name = models.CharField(max_length=45, null=False, blank=False)
    slug = models.SlugField(max_length=45, unique=True, null=False, blank=False)
    organization = models.ForeignKey(Organization)
    
    class Meta:
        verbose_name = _('list')
        verbose_name_plural = _('lists')

    def __unicode__(self):
        return self.name


class Word(models.Model):
    """Word model"""
    word = models.CharField(max_length=45, null=False, blank=False)
    type = models.ForeignKey(WordType)
    list = models.ForeignKey(List)
    
    class Meta:
        verbose_name = _('word')
        verbose_name_plural = _('words')

    def __unicode__(self):
        return self.word


class Description(models.Model):
    """Description model"""
    description = models.TextField(null=True, blank=True)
    words = models.TextField(null=True, blank=True)
    author = models.ForeignKey(User)
    class Meta:
        verbose_name = _('description')
        verbose_name_plural = _('descriptions')

    def __unicode__(self):
        return self.description
