from .models import UserSettings
from .forms import LoginForm

def include_login_form(request):
    form = LoginForm()
    return {'login_form': form}

def user_settings(request):
	user = request.user
	user_settings = None
	if user.is_authenticated():
		try:
			user_settings = UserSettings.objects.get(user=user)
		except UserSettings.DoesNotExist:
			pass
 	return {'user_settings': user_settings }
