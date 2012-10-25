from django import forms
from django.contrib.auth.models import User
from apps.game.models import Game

# Game canvas pixel resolution
RESOLUTION_CHOICES = (
    ('18_14', '18 cols, 14 rows'),
    ('16_12', '16 cols, 12 rows'),
    ('14_10', '14 cols, 10 rows'),
    ('12_8', '12 cols, 8 rows'),
)

class GameForm(forms.ModelForm):
	resolution = forms.ChoiceField(choices=RESOLUTION_CHOICES, initial='14_10')

	class Meta:
		model = Game
		exclude = ('cloned','slug','state','rows','cols',)

