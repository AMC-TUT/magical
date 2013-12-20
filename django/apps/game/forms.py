from django import forms
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from .models import Game, GameType, BLOCK_SIZE_CHOICES

# Game canvas pixel resolution
RESOLUTION_CHOICES = (
    ('18_14', '18 cols, 14 rows'),
    ('16_12', '16 cols, 12 rows'),
    ('14_10', '14 cols, 10 rows'),
    ('12_8', '12 cols, 8 rows'),
)

class GameForm(forms.ModelForm):
    title = forms.CharField(
    	max_length=100,
        required=True,
        label=_(u'Title'),
        widget=forms.TextInput(attrs={'class':'form-control'}),
    )

    type = forms.ModelChoiceField(
        required=True,
        queryset=GameType.objects.all(),
        label=_(u'Game Type'),
        widget=forms.Select(attrs={'class':'form-control'}),        
    )

    image = forms.ImageField(
    	required=False,
        label=_(u'Image'),
        widget=forms.ClearableFileInput(attrs={'class':'form-control'}),
    )

    description = forms.CharField(
    	required=False,
        label=_(u'Description'),
        widget=forms.Textarea(attrs={'class':'form-control'}),
    )

    block_size = forms.ChoiceField(
        label=_(u'Block size'),
        choices=BLOCK_SIZE_CHOICES,
        widget=forms.Select(attrs={'class':'form-control'}),
    )

    resolution = forms.ChoiceField(
        choices=RESOLUTION_CHOICES, 
        label=_(u'Resolution'),
        initial='14_10', 
        widget=forms.Select(attrs={'class':'form-control'}),
    )

    class Meta:
        model = Game
        exclude = ('creator', 'cloned','slug','state','rows','cols',)

    def __init__(self, *args, **kwargs):
		# only allow creators from user's own organization
		if kwargs.has_key('organization'):
			organization = kwargs.pop('organization')
		super(GameForm, self).__init__(*args, **kwargs)
