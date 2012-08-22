from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from apps.game.models import UserProfile, Country, Language, \
    Organization, OrganizationMembership, Role, Disability, \
    Achievement, AchievementMembership, Game, GameType, Author, \
    Revision
    

admin.site.unregister(User)

class UserProfileInline(admin.StackedInline):
    model = UserProfile

class UserProfileAdmin(UserAdmin):
    inlines = [ UserProfileInline, ]

admin.site.register(User, UserProfileAdmin)

admin.site.register(Language)
admin.site.register(Country)
admin.site.register(Organization)
admin.site.register(OrganizationMembership)
admin.site.register(Disability)
admin.site.register(Role)

admin.site.register(Achievement)
admin.site.register(AchievementMembership)
admin.site.register(Game)
admin.site.register(GameType)
admin.site.register(Author)
admin.site.register(Revision)
