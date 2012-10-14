from django import forms
from django.contrib.auth.models import User
from apps.game.models import Game

class GameForm(forms.ModelForm):

	class Meta:
		model = Game
		exclude = ('cloned','slug',)