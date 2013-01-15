from django import template
from django.contrib.auth.forms import AuthenticationForm

register = template.Library()

@register.inclusion_tag('apps/game/login_form.html', takes_context = True)
def login_form(context):
    request = context['request']
    form = AuthenticationForm(data=request.POST or None)
    return { 'form' : form }
