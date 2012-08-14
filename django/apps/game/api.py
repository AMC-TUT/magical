from tastypie.resources import ModelResource, ALL, ALL_WITH_RELATIONS
from tastypie import fields
from django.contrib.auth.models import User
from apps.game.models import Language, UserProfile
from tastypie.authentication import BasicAuthentication
from tastypie.authorization import DjangoAuthorization
from django.conf.urls import url

class UserProfileResource(ModelResource):
    class Meta:
        queryset = UserProfile.objects.all()
        resource_name = 'user_profile'
        include_absolute_uri = False
        include_resource_uri = False

class UserResource(ModelResource):
    profile = fields.ForeignKey(UserProfileResource, 'userprofile', full=True)
    class Meta:
        #queryset = User.objects.all().order_by('-last_name', '-first_name')
        queryset = User.objects.all()
        #authentication = BasicAuthentication()
        #authorization = DjangoAuthorization()
        ordering = ['-last_name', '-first_name']
        resource_name = 'users'
        excludes = ['password', 'is_active', 'is_staff', 'is_superuser']
        include_absolute_uri = False
        include_resource_uri = False
        allowed_methods = ["get"]
        filtering = {
            'username': ALL,
            'email': ALL
        }


    def override_urls(self):

        return [
            url(r"^(?P<resource_name>%s)/(?P<username>[\w\d_.-]+)/$" % self._meta.resource_name, self.wrap_view('dispatch_detail'), name="api_dispatch_detail"),
        ]


class LanguageResource(ModelResource):
    class Meta:
        queryset = Language.objects.all()
        resource_name = 'language'

