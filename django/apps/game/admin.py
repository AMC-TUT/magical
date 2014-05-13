from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.conf.urls import patterns, include, url
from .views import import_users
from .models import UserProfile, Country, Language, \
    Organization, Role, Disability, MagosAGame, MagosBGame, \
    Achievement, AchievementMembership, Game, GameType, Author, \
    Revision, Image, Audio, Review, Highscore, Gender, UserSettings

# remove unnecessary stuff from admin
admin.site.unregister(Site)
admin.site.unregister(User)

class UserProfileInline(admin.StackedInline):
    model = UserProfile

class UserProfileAdmin(UserAdmin):
    inlines = [ UserProfileInline, ]

    def get_urls(self):
        urls = super(UserProfileAdmin, self).get_urls()
        my_urls = patterns('',
            (r'^import/$', self.admin_site.admin_view(import_users))
        )
        return my_urls + urls
    pass

admin.site.register(User, UserProfileAdmin)
admin.site.register(Gender)

admin.site.register(Language)
admin.site.register(Country)
admin.site.register(Organization)
admin.site.register(Disability)
admin.site.register(Role)


class MagosGameAdmin(admin.ModelAdmin):
    list_display = ('title','state','created','updated','creator',)
    search_fields = ['title','description','creator',]
    #list_filter = ('Date Created','Date Updated',)
    #inlines = [CommentInline,]

admin.site.register(Achievement)
admin.site.register(AchievementMembership)
admin.site.register(MagosAGame, MagosGameAdmin)
admin.site.register(MagosBGame, MagosGameAdmin)
#admin.site.register(MagosBGame)
admin.site.register(GameType)
admin.site.register(Author)
admin.site.register(Revision)
#admin.site.register(Image)
admin.site.register(Review)
admin.site.register(Highscore)

admin.site.register(UserSettings)


import pprint
from django.contrib.sessions.models import Session
class SessionAdmin(admin.ModelAdmin):
    def _session_data(self, obj):
        return pprint.pformat(obj.get_decoded()).replace('\n', '<br>\n')
    _session_data.allow_tags=True
    list_display = ['session_key', '_session_data', 'expire_date']
    readonly_fields = ['_session_data']
    exclude = ['session_data']
    date_hierarchy='expire_date'
admin.site.register(Session, SessionAdmin)


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

# remove automatically filled fields from Image admin
class ImageAdmin(admin.ModelAdmin):
    exclude = ['height', 'width', 'slug', 'content_type', 'image_uuid']
admin.site.register(Image, ImageAdmin)
