#from tastypie.resources import ModelResource, ALL, ALL_WITH_RELATIONS
#from tastypie import fields
from django.contrib.auth.models import User
from apps.game.models import Language, UserProfile, Role
#from tastypie.authentication import BasicAuthentication
#from tastypie.authorization import DjangoAuthorization
from django.conf.urls import url

from djangorestframework.resources import ModelResource

class UserResource(ModelResource):
    model = User

    
    """      
class LanguageResource(ModelResource):
    class Meta:
        queryset = Language.objects.all()
        resource_name = 'language'
        include_absolute_uri = False
        include_resource_uri = False
        
class UserProfileResource(ModelResource):
    role = fields.CharField(attribute='role__name') # flat value
    language = fields.CharField(attribute='language__title') # flat value
    class Meta:
        queryset = UserProfile.objects.all()
        resource_name = 'user_profile'
        excludes = ['description', 'grade', 'group', 'updated', 'year_of_birth']
        include_absolute_uri = False
        include_resource_uri = False

class UserResource(ModelResource):
    language = fields.CharField(attribute='userprofile__language__title')
    role = fields.CharField(attribute='userprofile__role__name')
    
    class Meta:
        #queryset = User.objects.all().order_by('-last_name', '-first_name')
        queryset = User.objects.all()
        #authentication = SessionAuthentication()
        #authorization = DjangoAuthorization()
        ordering = ['-last_name', '-first_name']
        resource_name = 'users'
        excludes = ['id', 'email', 'password', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login']
        field_list_to_remove = ['language', 'role'] # remove these in list view
        
        include_absolute_uri = False
        include_resource_uri = False
        allowed_methods = ["get"]
        filtering = {
            'username': ALL,
            'email': ALL
        }

    def alter_list_data_to_serialize(self, request, to_be_serialized):
        #A hook to alter list data just before it gets serialized & sent to the user.
        #Useful for restructuring/renaming aspects of the what's going to be sent.
        for obj in to_be_serialized['objects']:
            for field_name in self._meta.field_list_to_remove:
                del obj.data[field_name]
        return to_be_serialized
       
    def override_urls(self):
        return [
            url(r"^(?P<resource_name>%s)/(?P<username>[\w\d_.-]+)/$" % self._meta.resource_name, self.wrap_view('dispatch_detail'), name="api_dispatch_detail"),
        ]
        
"""

