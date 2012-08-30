from django.shortcuts import render_to_response, render
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils import simplejson
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.core import serializers
from django.utils.decorators import method_decorator

from apps.game.models import Game, Language, Highscore
from django.contrib.auth.models import User

from apps.api.json_utils import JSONSerializer, json_response_from

from djangorestframework.compat import View
from djangorestframework.mixins import ResponseMixin
from djangorestframework.renderers import DEFAULT_RENDERERS
from djangorestframework.response import Response
from djangorestframework.reverse import reverse
from djangorestframework.authentication import UserLoggedInAuthentication
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

# Testing with CURL
# curl -X GET http://localhost:8000/api/v1/users/ -i
# curl -X POST -d score=235 http://localhost:8000/api/v1/highscores/super-mario -i

class HighscoreListView(ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
 
    def get(self, request, gameslug):
        session_user = request.user
        """
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        """
        #organization = session_user.get_profile().organization
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)

        highscores = Highscore.objects.filter(game__game=game).order_by('-score')

        items_list = []
        for highscore in highscores:
            item_dict = {}
            item_dict['firstName'] = highscore.user.first_name
            item_dict['lastName'] = highscore.user.last_name
            item_dict['score'] = highscore.score
            items_list.append(item_dict)
            
        response = Response(200, {'results': items_list})
        return self.render(response)

    def post(self, request, gameslug):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)
        # have to get the latest revision
        game_rev = game.get_latest_revision()
        score_list = request.POST.getlist('score', None)
        score = None
        if score_list and len(score_list):
            score = score_list[0]
        if score:
            print score
            print type(score)
            try:
                score = int(score)
                # store valid highscore
                highscore = Highscore(user=session_user, game=game_rev, score=score)
                highscore.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except ValueError:
                score = None
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
    
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(HighscoreListView,self).dispatch(*args,**kwargs)
        

class LanguagesListView(ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
 
    def get(self, request):
        session_user = request.user
        """
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        """
        url = reverse('languages-list-view', request=request)
        languages = Language.objects.all().order_by('title')
        items_list = []
        for language in languages:
            item_dict = {}
            item_dict['title'] = language.title
            item_dict['slug'] = language.slug
            item_dict['code'] = language.code
            items_list.append(item_dict)
        
        response = Response(200, {'results': items_list})
        return self.render(response)

    def post(self,request):
        response=Response(200,{'msg':'called via POST'})
        return self.render(response)
    
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(LanguagesListView,self).dispatch(*args,**kwargs)


class UsersListView(ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
 
    def get(self, request):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        url = reverse('users-list-view', request=request)
        organization = session_user.get_profile().organization        
        users = User.objects.filter(userprofile__organization=organization).order_by('last_name', 'first_name')
        #data = serializers.serialize('python', users, fields=('first_name','last_name'))
        #jsonSerializer = JSONSerializer()
        #users_json = jsonSerializer.serialize(users, use_natural_keys=True)
        users_list = []
        for user in users:
            user_dict = {}
            user_dict['userName'] = user.username
            user_dict['firstName'] = user.first_name
            user_dict['lastName'] = user.last_name
            users_list.append(user_dict)
        
        response = Response(200, {'results': users_list})
        return self.render(response)

    def post(self,request):
        response=Response(200,{'msg':'called via POST'})
        return self.render(response)
    
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(UsersListView,self).dispatch(*args,**kwargs)

        
class UserDetailView(ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
 
    def get(self, request, username):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        organization = session_user.get_profile().organization        
        try:
            user = User.objects.get(username=username, userprofile__organization=organization)
        except User.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'User not found'})
            return self.render(response)
        profile = user.get_profile()
        
        user_dict = {}
        user_dict['userName'] = user.username
        user_dict['firstName'] = user.first_name
        user_dict['lastName'] = user.last_name
        user_dict['language'] = profile.language.title
        user_dict['role'] = profile.role.name
        response = Response(200, user_dict)
        return self.render(response)

    def post(self,request):
        response=Response(200,{'msg':'called via POST'})
        return self.render(response)
    
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(UserDetailView,self).dispatch(*args,**kwargs)
        