from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from apps.game.models import UserProfile, Country, Language

admin.site.unregister(User)

class UserProfileInline(admin.StackedInline):
    model = UserProfile

class UserProfileAdmin(UserAdmin):
    inlines = [ UserProfileInline, ]

admin.site.register(User, UserProfileAdmin)

admin.site.register(Language)
admin.site.register(Country)

