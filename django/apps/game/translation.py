# encoding: utf-8
from modeltranslation.translator import translator, TranslationOptions
from .models import Gender


class GenderTranslationOptions(TranslationOptions):
    fields = ('name',)

translator.register(Gender, GenderTranslationOptions)
