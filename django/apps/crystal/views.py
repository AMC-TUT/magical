from django.shortcuts import render_to_response, render
from django.template import RequestContext
from django.http import HttpResponse, Http404, HttpResponseNotAllowed
from apps.crystal.models import Word, WordType, List
from django.utils import simplejson

def home(request):
    tpl = 'apps/crystal/index.html'
    user = request.user
    
    return render(request, tpl, {})

def ajax_list_words(request, slug):
    """
    List words.
    :param request: Http request object.
    """
    try:
        word_list = List.objects.get(slug=slug)
        words = word_list.word_set.all().order_by('type')
        
        grouped_list = {}
        grouped_words = dict()
        
        for word in words:
            if word.type.name in grouped_words:
                group_words = grouped_words[word.type.name]
            else:
                group_words = []
            group_words.append({ 'word' : word.word })
            grouped_words[word.type.name] = group_words
            
        
    except List.DoesNotExist:
        grouped_words = {}
        
    data = simplejson.dumps(grouped_words)
    return HttpResponse(data, mimetype='application/json')
