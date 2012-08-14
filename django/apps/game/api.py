from tastypie.resources import ModelResource
from tastypie import fields
from django.contrib.auth.models import User
from apps.game.models import Language, UserProfile

class UserProfileResource(ModelResource):
    class Meta:
        queryset = UserProfile.objects.all()
        resource_name = 'user_profile'
        include_absolute_uri = False
        include_resource_uri = False

class UserResource(ModelResource):
    profile = fields.ToOneField(UserProfileResource, 'userprofile', full=True)
    class Meta:
        queryset = User.objects.all()
        resource_name = 'user'

class LanguageResource(ModelResource):
    class Meta:
        queryset = Language.objects.all()
        resource_name = 'language'

