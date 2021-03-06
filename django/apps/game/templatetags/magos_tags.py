import subprocess
from django.template import Library
from apps.game.models import Game, MagosAGame, MagosBGame, Language
from django.contrib.auth.models import User

register = Library()

try:
    head = subprocess.Popen('git log -1 --format="%h" HEAD',
        shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    VERSION = head.stdout.readline().strip()
    head_date = subprocess.Popen('git log -1 --format="%ci" HEAD',
        shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    VERSION_DATE = head_date.stdout.readline().strip()
except:
    VERSION = u'unknown'


@register.simple_tag
def git_rev_tag():
    return "%s (%s)" % (VERSION_DATE, VERSION)

@register.inclusion_tag('apps/game/magos_statistics.html')
def magos_statistics():
	total_magos_a_games = MagosAGame.objects.all().count()
	total_magos_b_games = MagosBGame.objects.all().count()
	total_magos_games = Game.objects.all().count()
	total_magos_users = User.objects.all().count()

 	return {
 		'total_magos_games': total_magos_games, 
 		'total_magos_a_games': total_magos_a_games, 
 		'total_magos_b_games': total_magos_b_games,
 		'total_magos_users': total_magos_users
 	}


@register.inclusion_tag('apps/game/magos_languages.html', takes_context = True)
def magos_languages(context, user):
    request = context['request']
    user_profile = user.get_profile()
    user_language = user_profile.language
    magos_languages = Language.objects.all()
    return {
        'user_language': user_language,
        'magos_languages': magos_languages,
        'request_path': request.path
    }
