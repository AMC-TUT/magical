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
import json

from apps.game.models import Game, MagosAGame, MagosBGame, Language, Highscore, Review, Image, Audio, \
    GameType, Author, Revision
from django.contrib.auth.models import User
from django.db import IntegrityError
from apps.api.json_utils import JSONSerializer, json_response_from

from djangorestframework.compat import View
from djangorestframework.mixins import RequestMixin, ResponseMixin
from djangorestframework.renderers import DEFAULT_RENDERERS
from djangorestframework.parsers import DEFAULT_PARSERS
from djangorestframework.response import Response
from djangorestframework.reverse import reverse
from djangorestframework.authentication import UserLoggedInAuthentication
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.template.defaultfilters import slugify

from django.conf import settings

# Testing with CURL
# curl -X GET http://localhost:8000/api/v1/users/ -i
# curl -X POST -d score=235 http://localhost:8000/api/v1/highscores/super-mario -i
# multipart
# curl -X POST -F "name=huuhaa" -F "type=0" -F "state=1" -F "image=@foobar.png" http://localhost:8000/api/v1/images -i

class RevisionView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS

    def get(self, request, gameslug):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        organization = session_user.get_profile().organization        
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)
        DEFAULT_LIMIT = 50
        DEFAULT_OFFSET = 0
        rev_limit = request.GET.get('limit', DEFAULT_LIMIT)
        rev_offset = request.GET.get('offset', DEFAULT_OFFSET)
        if rev_limit is not DEFAULT_LIMIT:
            try:
                rev_limit = int(rev_limit)
            except ValueError:
                rev_limit = DEFAULT_LIMIT
        if rev_offset is not DEFAULT_OFFSET:
            try:
                rev_offset = int(rev_offset)
            except ValueError:
                rev_offset = DEFAULT_OFFSET

        revisions_list = []
        revisions = game.revision_set.all()
        for revision in revisions:
            revision_dict = {}
            json_data = ""
            try:
                json_data = json.loads(revision.data)
            except ValueError:
                pass
            if game.get_real_instance_class() == MagosBGame:
                revision_dict['level1'] = json_data
            else:
                revision_dict['revision'] = json_data
            revisions_list.append(revision_dict)
        result_dict = {}
        result_dict['offset'] = rev_offset
        result_dict['limit'] = rev_limit
        result_dict['count'] = revisions.count()
        result_dict['results'] = revisions_list

        response = Response(200, result_dict)
        return self.render(response)

    def post(self, request, gameslug):
        post_data = self.DATA
        valid_data = True
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)
            
        game_list = post_data.getlist('game', None) # JSON formatted Game object
        # game title
        game_json = None
        if game_list and len(game_list):
            game_json = game_list[0]
        
        if game_json:
            try:
                instance = Revision(game=game, data=game_json)
                instance.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)        

    def put(self, request, gameslug):
        put_data = self.DATA
        valid_data = True
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)
            
        game_list = put_data.getlist('game', None) # JSON formatted Game object
        # game title
        game_json = None
        if game_list and len(game_list):
            game_json = game_list[0]
        
        if game_json:
            try:
                # TODO: revision should be identified?
                revision = game.get_latest_revision() # let's update the latest only
                revision.data =  game_json
                revision.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)          
        
        
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(RevisionView,self).dispatch(*args,**kwargs)        

        
class GameDetailView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
 
    def get(self, request, gameslug):
        #import ipdb;ipdb.set_trace()
        game = None
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)
        if game:
            #if not game.state == 2:
                # public games can be accessed even by anonymous users
            session_user = request.user
            #print session_user
            #if not session_user.is_authenticated():
                #response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
                #return self.render(response)
        result_dict = {}
        result_dict['title'] = game.title
        result_dict['id'] = game.id
        if hasattr(game, "type"):
            result_dict['type'] = game.type.name
        result_dict['state'] = game.state
        result_dict['description'] = game.description
        result_dict['cloned'] = game.cloned
        # get game authors and organization
        authors = game.author_set.all()
        authors_list = []
        organization = None
        if authors:
            organization = authors[0].user.userprofile.organization.name # organization (=author's organization)
        for author in authors:
            author_dict = {}
            author_dict['firstName'] = author.user.first_name
            author_dict['lastName'] = author.user.last_name
            author_dict['userName'] = author.user.username
            authors_list.append(author_dict)

        result_dict['authors'] = authors_list
        result_dict['organization'] = organization

        revision = game.get_latest_revision()
        revision_dict = {}
        if revision:
            revision_dict['data'] = revision.data

        json_data = ""
        try:
            json_data = json.loads(revision.data)
        except ValueError:
            pass
        if game.get_real_instance_class() == MagosBGame:
            result_dict['level1'] = json_data
        else:
            result_dict['revision'] = json_data

        response = Response(200, result_dict)
        return self.render(response)

    def put(self, request, gameslug):
        """
        PUT - update revision
        """
        put_data = self.DATA
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)

        valid_data = False

        state_list = put_data.getlist('state', None) # Game state (0=private, 1=public for organizaton, 2=public for all)
        revision_list = put_data.getlist('revision', None) #  Game revision as JSON (game_type:slug)

        # state
        state = None
        if state_list and len(state_list):
            state = state_list[0]

        revision_data = None
        if revision_list and len(revision_list):
            revision_data = revision_list[0]

        if state and revision_data:
            valid_data = True
        
        if valid_data:
            try:
                # set state
                game.state = state
                game.save()

                # update revision
                revision = game.get_latest_revision()
                revision.game = game
                revision.data = revision_data
                revision.save()

                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass

        response=Response(400,{'message':'Invalid data'})
        return self.render(response)


    def post(self, request, gameslug):
        """
        POST - add new revision
        """
        post_data = self.DATA
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        try:
            game = Game.objects.get(slug=gameslug)
        except Game.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
            return self.render(response)
        
        valid_data = False

        state_list = post_data.getlist('state', None) # Game state (1=private, 2=public)
        revision_list = post_data.getlist('revision', None) #  Game revision as JSON (game_type:slug)

        # state
        state = None
        if state_list and len(state_list):
            state = state_list[0]

        # state
        revision_data = None
        if revision_list and len(revision_list):
            revision_data = revision_list[0]

        if state and revision_data:
            valid_data = True
        
        if valid_data:
            try:
                # set state
                game.state = state
                game.save()

                # create a new revision
                revision = Revision(game=game, data=revision_data)
                revision.save()

                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass

        response=Response(400,{'message':'Invalid data'})
        return self.render(response)    
    
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(GameDetailView,self).dispatch(*args,**kwargs)


class GameView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def post(self, request):
        post_data = self.DATA
        valid_data = True
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        name_list = post_data.getlist('name', None) # Title of the game
        type_list = post_data.getlist('type', None) #  Game's type (game_type:slug)
        description_list = post_data.getlist('description', None) #  some info
        cloned_list = post_data.getlist('cloned', None) #  cloned game's slug
        authors_list = post_data.getlist('authors', None) #   usernames of the game creators (array)
        # game title
        title = None
        if name_list and len(name_list):
            title = name_list[0]
        # description
        description = None
        if description_list and len(description_list):
            description = description_list[0]
        # game type
        type_slug = None
        if type_list and len(type_list):
            type_slug = type_list[0]
            try:                
                type_slug = GameType.objects.get(slug=type_slug)
            except GameType.DoesNotExist:
                valid_data = False
        # cloned
        cloned_slug = None
        if cloned_list and len(cloned_list):
            cloned_slug = cloned_list[0]
            try:
                print cloned_slug
                cloned_slug = Game.objects.get(slug=cloned_slug)
            except Game.DoesNotExist:
                valid_data = False
        if valid_data:
            try:
                slug = slugify(title)
                cloned = None
                if cloned_slug:
                    cloned = cloned_slug.id
                instance = Game(title=title, slug=slug, type=type_slug, description=description, cloned=cloned)
                instance.save()
                # handle authors
                if authors_list and len(authors_list):
                    for author in authors_list:
                        try:
                            author_user = User.objects.get(username=author)
                            author_instance = Author(user=author_user, game=instance)
                            author_instance.save()
                        except User.DoesNotExist:
                            pass
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
  
    def get(self, request):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        DEFAULT_LIMIT = 50
        DEFAULT_OFFSET = 0
        game_limit = request.GET.get('limit', DEFAULT_LIMIT)
        game_offset = request.GET.get('offset', DEFAULT_OFFSET)
        if game_limit is not DEFAULT_LIMIT:
            try:
                game_limit = int(game_limit)
            except ValueError:
                game_limit = DEFAULT_LIMIT
        if game_offset is not DEFAULT_OFFSET:
            try:
                game_offset = int(game_offset)
            except ValueError:
                game_offset = DEFAULT_OFFSET
        # TODO: filtering by type, offset and limit have to be implemented
        games = Game.objects.all()
        game_count = games.count()
        results_list = []
        for game in games:
            result_dict = {}
            result_dict['title'] = game.title
            result_dict['id'] = game.id
            if hasattr(game, "type"):
                result_dict['type'] = game.type.name
            result_dict['state'] = game.state
            result_dict['description'] = game.description
            result_dict['cloned'] = game.cloned
            # get game authors
            authors = game.author_set.all()
            authors_list = []
            for author in authors:
                author_dict = {}
                author_dict['firstName'] = author.user.first_name
                author_dict['lastName'] = author.user.last_name
                author_dict['userName'] = author.user.username
                authors_list.append(author_dict)

            result_dict['authors'] = authors_list

            if game.get_real_instance_class() == MagosBGame:
                result_dict['level1'] = game.get_latest_revision().id
            else:
                result_dict['revision'] = game.get_latest_revision().id
            results_list.append(result_dict)
        
        response = Response(200, { \
            'statusCode' : 200, \
            'offset' : game_offset, \
            'limit' : game_limit, \
            'count' : game_count, \
            'results': results_list \
            })         
        return self.render(response)

        
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(GameView,self).dispatch(*args,**kwargs)


class AudioSearchView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def get(self, request):
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        search_term = request.GET.get('search', None)
        DEFAULT_LIMIT = 50
        DEFAULT_OFFSET = 0
        audio_limit = request.GET.get('limit', DEFAULT_LIMIT)
        audio_offset = request.GET.get('offset', DEFAULT_OFFSET)
        if audio_limit is not DEFAULT_LIMIT:
            try:
                audio_limit = int(audio_limit)
            except ValueError:
                audio_limit = DEFAULT_LIMIT
        if audio_offset is not DEFAULT_OFFSET:
            try:
                audio_offset = int(audio_offset)
            except ValueError:
                audio_offset = DEFAULT_OFFSET
        # TODO: offset and limit have to be implemented
        audios = Audio.objects.filter(name__icontains=search_term)
        audio_count = audios.count()
        results_list = []
        for audio in audios:
            result_dict = {}
            result_dict['name'] = audio.name
            result_dict['slug'] = audio.slug
            result_dict['state'] = audio.state
            result_dict['file'] = audio.audio_url # base64 encoded
            results_list.append(result_dict)
        
        response = Response(200, { \
            'statusCode' : 200, \
            'offset' : audio_offset, \
            'limit' : audio_limit, \
            'count' : audio_count, \
            'results': results_list \
            })         
        return self.render(response)
        
   
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(AudioSearchView,self).dispatch(*args,**kwargs)

class AudioUpdateView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def put(self, request, audioslug):
        put_data = self.DATA
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        audio = None
        try:
            audio = Audio.objects.get(slug=audioslug)
        except Audio.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Audio not found'})
            return self.render(response)
        valid_data = True
        state_list = put_data.getlist('state', None) # 0|1 (private|public)
        # audio state
        state = None
        if state_list and len(state_list):
            state = state_list[0]
            try:
                state = int(state)
                if(state not in [0,1]):
                    valid_data = False
            except ValueError:
                valid_data = False
        if valid_data:
            print "State: %s" % state
            try:
                audio.state = state
                audio.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except ValueError:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
  
   
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(AudioUpdateView,self).dispatch(*args,**kwargs)


class AudioView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def post(self, request):
        post_data = self.DATA
        post_files = self.FILES
        valid_data = True
        audio_list = post_files.getlist('audio', None)
        audio = None
        if audio_list and len(audio_list):
            audio = audio_list[0]
        else:
            valid_data = False
        #return HttpResponseBadRequest('Bad file type')
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        name_list = post_data.getlist('name', None) # Name of the Image
        state_list = post_data.getlist('state', None) # 0|1 (private|public)
        # audio name
        name = None
        if name_list and len(name_list):
            name = name_list[0]
        # audio state
        state = None
        if state_list and len(state_list):
            state = state_list[0]
            try:
                state = int(state)
                if(state not in [0,1]):
                    valid_data = False
            except ValueError:
                valid_data = False

        if valid_data:
            print "Name: %s | State: %s" % (name, state)
            try:
                slug = slugify(name)
                instance = Audio(name=name, slug=slug, state=state, file=audio, author=session_user)
                instance.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
  
    def get(self, request):
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        DEFAULT_LIMIT = 50
        DEFAULT_OFFSET = 0
        audio_type = request.GET.get('type', None)
        audio_limit = request.GET.get('limit', DEFAULT_LIMIT)
        audio_offset = request.GET.get('offset', DEFAULT_OFFSET)
        if audio_limit is not DEFAULT_LIMIT:
            try:
                audio_limit = int(audio_limit)
            except ValueError:
                audio_limit = DEFAULT_LIMIT
        if audio_offset is not DEFAULT_OFFSET:
            try:
                audio_offset = int(audio_offset)
            except ValueError:
                audio_offset = DEFAULT_OFFSET
        # TODO: filtering by type, offset and limit have to be implemented
        audios = Audio.objects.all()
        audio_count = audios.count()
        results_list = []
        for audio in audios:
            result_dict = {}
            result_dict['name'] = audio.name
            result_dict['slug'] = audio.slug
            result_dict['state'] = audio.state
            result_dict['file'] = audio.audio_url # base64 encoded
            results_list.append(result_dict)
        
        response = Response(200, { \
            'statusCode' : 200, \
            'offset' : audio_offset, \
            'limit' : audio_limit, \
            'count' : audio_count, \
            'results': results_list \
            })         
        return self.render(response)

        
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(AudioView,self).dispatch(*args,**kwargs)


class ImageSearchView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def get(self, request):
        session_user = request.user
        #test_user = User.objects.get(id=1)
        #session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        search_term = request.GET.get('search', None)
        DEFAULT_LIMIT = 50
        DEFAULT_OFFSET = 0
        img_limit = request.GET.get('limit', DEFAULT_LIMIT)
        img_offset = request.GET.get('offset', DEFAULT_OFFSET)
        if img_limit is not DEFAULT_LIMIT:
            try:
                img_limit = int(img_limit)
            except ValueError:
                img_limit = DEFAULT_LIMIT
        if img_offset is not DEFAULT_OFFSET:
            try:
                img_offset = int(img_offset)
            except ValueError:
                img_offset = DEFAULT_OFFSET
        # TODO: offset and limit have to be implemented
        images = Image.objects.filter(name__icontains=search_term)
        img_count = images.count()
        #images = Image.objects.all()
        results_list = []
        for image in images:
            result_dict = {}
            #img = open( image.file.path, "rb")
            #data = img.read()
            result_dict['name'] = image.name
            result_dict['slug'] = image.slug
            result_dict['type'] = image.image_type
            result_dict['state'] = image.state
            #result_dict['file'] = image.image_url # base64 encoded
            result_dict['file'] = image.image_file.name  # path
            results_list.append(result_dict)
        
        response = Response(200, { \
            'statusCode' : 200, \
            'offset' : img_offset, \
            'limit' : img_limit, \
            'count' : img_count, \
            'results': results_list \
            })         
        return self.render(response)
        
   
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(ImageSearchView,self).dispatch(*args,**kwargs)

class ImageUpdateView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def put(self, request, imageslug):
        put_data = self.DATA
        session_user = request.user
        test_user = User.objects.get(id=1)
        session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        image = None
        try:
            image = Image.objects.get(slug=imageslug)
        except Image.DoesNotExist:
            response = Response(404, {'statusCode': 404, 'message' : 'Image not found'})
            return self.render(response)
        valid_data = True
        state_list = put_data.getlist('state', None) # 0|1 (private|public)
        # image state
        state = None
        if state_list and len(state_list):
            state = state_list[0]
            try:
                state = int(state)
                if(state not in [0,1]):
                    valid_data = False
            except ValueError:
                valid_data = False
        if valid_data:
            print "State: %s" % state
            try:
                image.state = state
                image.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except ValueError:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
  
   
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(ImageUpdateView,self).dispatch(*args,**kwargs)


class ImageView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def post(self, request):
        post_data = self.DATA
        post_files = self.FILES
        valid_data = True
        image_list = post_files.getlist('image', None)
        image = None
        if image_list and len(image_list):
            image = image_list[0]
        else:
            valid_data = False
        #return HttpResponseBadRequest('Bad file type')
        session_user = request.user
        #test_user = User.objects.get(id=1)
        #session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        name_list = post_data.getlist('name', None) # Name of the Image
        type_list = post_data.getlist('type', None) # 0|1 (image|anim sprite)
        state_list = post_data.getlist('state', None) # 0|1 (private|public)
        # image name
        name = None
        if name_list and len(name_list):
            name = name_list[0]
        # image type
        type = None
        if type_list and len(type_list):
            type = type_list[0]
            try:
                type = int(type)
                if(type not in [0,1]):
                    valid_data = False
            except ValueError:
                valid_data = False
        # image state
        state = None
        if state_list and len(state_list):
            state = state_list[0]
            try:
                state = int(state)
                if(state not in [0,1]):
                    valid_data = False
            except ValueError:
                valid_data = False

        if valid_data:
            #print "Name: %s | Type: %s | State: %s" % (name, type, state)
            try:
                slug = slugify(name)
                instance = Image(name=name, slug=slug, type=type, state=state, file=image, author=session_user)
                instance.save()
                response=Response(200,{'statusCode' : 200 })
                return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
  
    def get(self, request):
        session_user = request.user
        #test_user = User.objects.get(id=1)
        #session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        DEFAULT_LIMIT = 50
        DEFAULT_OFFSET = 0
        img_type = request.GET.get('type', None)
        img_limit = request.GET.get('limit', DEFAULT_LIMIT)
        img_offset = request.GET.get('offset', DEFAULT_OFFSET)
        if img_limit is not DEFAULT_LIMIT:
            try:
                img_limit = int(img_limit)
            except ValueError:
                img_limit = DEFAULT_LIMIT
        if img_offset is not DEFAULT_OFFSET:
            try:
                img_offset = int(img_offset)
            except ValueError:
                img_offset = DEFAULT_OFFSET
        # filtering by type, offset and limit
        kwargs = {}
        if img_type:
            kwargs['image_type'] = img_type
        images = Image.objects.filter(**kwargs).order_by('name')
        img_count = images.count()
        results_list = []
        for image in images:
            result_dict = {}
            #img = open( image.file.path, "rb")
            #data = img.read()
            result_dict['name'] = image.name
            result_dict['slug'] = image.slug
            result_dict['type'] = image.image_type
            result_dict['state'] = image.state
            result_dict['ext'] = image.content_type.sub_type
            #result_dict['file'] = image.image_url # base64 encoded
            #result_dict['file'] = image.image_file.name # path
            result_dict['file'] = image.image_uuid # image uuid
            results_list.append(result_dict)
        
        response = Response(200, { \
            'statusCode' : 200, \
            'offset' : img_offset, \
            'limit' : img_limit, \
            'count' : img_count, \
            'results': results_list \
            })         
        return self.render(response)

        
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(ImageView,self).dispatch(*args,**kwargs)


class GameReviewView(RequestMixin, ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
    parsers = DEFAULT_PARSERS
    
    def post(self, request):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        game_list = request.POST.getlist('game', None)
        game_slug = None
        if game_list and len(game_list):
            game_slug = game_list[0]
        if game_slug:
            try:
                game = Game.objects.get(slug=game_slug)
            except Game.DoesNotExist:
                response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
                return self.render(response)
        # have to get the latest revision
        #game_rev = game.get_latest_revision()
        comment = None
        comment_list = request.POST.getlist('comment', None)
        if comment_list and len(comment_list):
            comment = comment_list[0]
        # how many stars
        stars_list = request.POST.getlist('stars', None)
        stars = None
        if stars_list and len(stars_list):
            stars = stars_list[0]
        if stars:
            try:
                stars = int(stars)
                if 0 < stars <= 5:
                    # store valid new review
                    review = Review(user=session_user, game=game, stars=stars, comment=comment)
                    review.save()
                    response=Response(200,{'statusCode' : 200 })
                    return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)


    def put(self, request):
        put_data = self.DATA
        session_user = request.user
        #test_user = User.objects.get(id=1)
        #session_user = test_user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
        game_list = put_data.getlist('game', None)
        game_slug = None
        if game_list and len(game_list):
            game_slug = game_list[0]
        if game_slug:
            try:
                game = Game.objects.get(slug=game_slug)
            except Game.DoesNotExist:
                response = Response(404, {'statusCode': 404, 'message' : 'Game not found'})
                return self.render(response)
        comment = None
        comment_list = put_data.getlist('comment', None)
        if comment_list and len(comment_list):
            comment = comment_list[0]
        # how many stars
        stars_list = put_data.getlist('stars', None)
        stars = None
        if stars_list and len(stars_list):
            stars = stars_list[0]
        if stars:
            try:
                stars = int(stars)
                if 0 < stars <= 5:
            	    # store updated review
                    review = None
                    try:
                        review = Review.objects.get(user=session_user, game=game)
                    except Review.DoesNotExist:
                        review = Review(user=session_user, game=game, stars=0)
                    review.stars = stars
                    review.comment = comment
                    review.save()
                    response=Response(200,{'statusCode' : 200 })
                    return self.render(response)
            except (ValueError, IntegrityError) as e:
                pass
        response=Response(400,{'message':'Invalid data'})
        return self.render(response)
    
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(GameReviewView,self).dispatch(*args,**kwargs)
        

class HighscoreListView(ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
 
    def get(self, request, gameslug):
        session_user = request.user
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
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
        if not session_user.is_authenticated():
            response = Response(403, {'statusCode': 403, 'message' : 'Not authorized'})
            return self.render(response)
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

        
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(UserDetailView,self).dispatch(*args,**kwargs)
        

class AnonUserCreateView(ResponseMixin, View):
    """
    Create session for anonymous user
    """
    renderers = DEFAULT_RENDERERS
 
    def get(self, request):
        session_user = request.user
        session_id = request.session._get_or_create_session_key()
        ses = request.session

        ses['username'] = 'anonymous'
        ses['role'] = 'player'
        ses['lang'] = 'english'
        ses['lang_code'] = 'en'
        ses['organization'] = 'magos'
        ses['firstname'] = 'Magos'
        ses['lastname'] = 'Player'
        ses['use_uppercase_text'] = False
        ses.save()
        ses.modified = True

        response = Response(200, session_id)
        return self.render(response)

    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(AnonUserCreateView,self).dispatch(*args,**kwargs)


class UsersGamesView(ResponseMixin, View):
    renderers = DEFAULT_RENDERERS
 
    def get(self, request, username):
        """
        Magos B games where user is an author
        """
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
        game_ids = user.author_set.all().values_list('game__id', flat=True)

        games = Game.objects.instance_of(MagosBGame).filter(id__in=game_ids)

        games_list = []
        for game in games:
            game_dict = {}
            game_dict['title'] = game.title
            game_dict['slug'] = game.slug
            game_dict['created'] = game.created
            game_dict['updated'] = game.updated
            games_list.append(game_dict)

        user_dict = {}
        user_dict['userName'] = user.username
        user_dict['games'] = games_list
        response = Response(200, user_dict)
        return self.render(response)

        
    @method_decorator(csrf_exempt)
    def dispatch(self,*args,**kwargs):
        return super(UsersGamesView,self).dispatch(*args,**kwargs)

