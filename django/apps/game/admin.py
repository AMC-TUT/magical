from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from apps.game.models import UserProfile, Country, Language, \
    Organization, Role, Disability, \
    Achievement, AchievementMembership, Game, GameType, Author, \
    Revision, Image, Audio, Review, Highscore, Gender

# remove unnecessary stuff from admin
admin.site.unregister(Site)
admin.site.unregister(User)

class UserProfileInline(admin.StackedInline):
    model = UserProfile

class UserProfileAdmin(UserAdmin):
    inlines = [ UserProfileInline, ]

admin.site.register(User, UserProfileAdmin)
admin.site.register(Gender)

admin.site.register(Language)
admin.site.register(Country)
admin.site.register(Organization)
admin.site.register(Disability)
admin.site.register(Role)

admin.site.register(Achievement)
admin.site.register(AchievementMembership)
admin.site.register(Game)
admin.site.register(GameType)
admin.site.register(Author)
admin.site.register(Revision)
admin.site.register(Image)
admin.site.register(Review)
admin.site.register(Highscore)

class AudioFileAdmin(admin.ModelAdmin):

	# add 'audio_file_player' tag to your admin view
	list_display = ('name', 'audio_file_player')
	actions = ['custom_delete_selected']

	def custom_delete_selected(self, request, queryset):
	    #custom delete code
	    n = queryset.count()
	    for i in queryset:
	        if i.audio_file:
	            if os.path.exists(i.audio_file.path):
	                os.remove(i.audio_file.path)
	        i.delete()
	    self.message_user(request, _("Successfully deleted %d audio files.") % n)
	custom_delete_selected.short_description = "Delete selected items"

	def get_actions(self, request):
	    actions = super(AudioFileAdmin, self).get_actions(request)
	    del actions['delete_selected']
	    return actions

admin.site.register(Audio, AudioFileAdmin)

