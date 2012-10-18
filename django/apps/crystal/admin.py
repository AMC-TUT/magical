from django.contrib import admin
from apps.crystal.models import List, WordType, Word, Description

admin.site.register(List)
admin.site.register(WordType)
admin.site.register(Word)
admin.site.register(Description)
