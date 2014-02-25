from django import forms
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import authenticate
from django.template.defaultfilters import slugify
from taggit.forms import *
from .models import Game, MagosAGame, MagosBGame, GameType, BLOCK_SIZE_CHOICES, \
    Organization, Gender, UserSettings, Language


class AjaxBaseForm(forms.BaseForm):
    def errors_as_json(self, strip_tags=False):
        error_summary = {}
        errors = {}
        for error in self.errors.iteritems():
            errors.update({
                error[0]: unicode(striptags(error[1])
                                  if strip_tags else error[1])
            })
        error_summary.update({'errors': errors})
        return error_summary


# Game canvas pixel resolution
RESOLUTION_CHOICES = (
    ('18_14', '18 cols, 14 rows'),
    ('16_12', '16 cols, 12 rows'),
    ('14_10', '14 cols, 10 rows'),
    ('12_8', '12 cols, 8 rows'),
)

class GameImageForm(forms.Form):
    image = forms.ImageField(
        required=True,
        label=_(u'Game image'),
        widget=forms.ClearableFileInput(attrs={'class':'form-control'}),
    )
    game_slug = forms.CharField(required=True, widget=forms.HiddenInput())

    def __init__(self, *args, **kwargs):
        game_slug = kwargs.pop('game_slug', None)
        super(GameImageForm, self).__init__(*args, **kwargs)
        if game_slug:
            self.fields['game_slug'].initial = game_slug


class BaseGameForm(forms.ModelForm):
    title = forms.CharField(
    	max_length=100,
        required=True,
        label=_(u'Title'),
        widget=forms.TextInput(attrs={'class':'form-control'}),
    )

    description = forms.CharField(
    	required=False,
        label=_(u'Description'),
        widget=forms.Textarea(attrs={'class':'form-control'}),
    )

    tags = TagField(
        label=_(u'Tags'),
        required=False,
        help_text=_(u'A comma-separated list of tags.'),
        widget=forms.TextInput(attrs={'class':'form-control'}),
    )

    class Meta:
        model = Game
        include = ['title' , 'description', ]     

    def __init__(self, *args, **kwargs):
		# only allow creators from user's own organization
		if kwargs.has_key('organization'):
			organization = kwargs.pop('organization')
		super(BaseGameForm, self).__init__(*args, **kwargs)

    def clean_title(self):
        title = self.cleaned_data['title']
        slug = slugify(title)
        try:
            Game.objects.get(slug=slug)
            raise forms.ValidationError(_(u"Game with the same title exists. Try another title."))

        except Game.DoesNotExist:
            pass
        return title


class MagosAGameForm(BaseGameForm):

    type = forms.ModelChoiceField(
        required=True,
        queryset=GameType.objects.all(),
        label=_(u'Game Type'),
        widget=forms.Select(attrs={'class':'form-control'}),        
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
        model = MagosAGame
        exclude = ('image', 'creator', 'cloned', 'slug', 'state', 'rows', 'cols',)


class MagosBGameForm(BaseGameForm):

    class Meta:
        model = MagosBGame
        exclude = ('image', 'creator', 'cloned', 'slug', 'state', 'rows', 'cols', 'cloned', )


class LoginForm(forms.Form):
    username = forms.CharField(max_length=255, required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')
        user = authenticate(username=username, password=password)
        if not user or not user.is_active:
            raise forms.ValidationError(_(u"Login was invalid. Please try again."))
        return self.cleaned_data

    def login(self, request):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')
        user = authenticate(username=username, password=password)
        return user

class UserRegistrationForm(UserCreationForm):

    username = forms.CharField(
        required = True, 
        widget=forms.TextInput(attrs={'class':'form-control small'})
    )

    email = forms.EmailField(
        required = False, 
        widget=forms.TextInput(attrs={'class':'form-control'})
    )

    first_name = forms.CharField(
        required = False, 
        widget=forms.TextInput(attrs={'class':'form-control small'})
    )

    last_name = forms.CharField(
        required = False, 
        widget=forms.TextInput(attrs={'class':'form-control small'})
    )

    password1 = forms.CharField(
        label=_(u'Password'),
        widget=forms.PasswordInput(attrs={'class':'form-control small'})
    )

    password2 = forms.CharField(
        label=_(u'Password again'),
        widget=forms.PasswordInput(attrs={'class':'form-control small'})
    )

    gender = forms.ModelChoiceField(
        required=False,
        queryset=Gender.objects.all(),
        empty_label=_(u'Select gender'),
        widget=forms.Select(attrs={'class':'form-control small'})
    )

    language = forms.ModelChoiceField(
        required=True,
        queryset=Language.objects.all(),
        empty_label=None,
        widget=forms.Select(attrs={'class':'form-control small'})
    )

    special_code = forms.CharField(
        required = False, 
        label = _(u'I have a special code'),
        max_length = 8,
        widget=forms.TextInput(attrs={'class':'form-control small'})
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')  

    def clean_special_code(self):
        special_code = self.cleaned_data.get('special_code' or None)
        if special_code:
            organization = self.get_special_organization(special_code)
            # wrong special code
            if not organization:
                raise forms.ValidationError(_(u"Code is not valid."))
        return special_code


    def clean(self):
        organization = self.get_public_organization()
        # if no organization 
        if not organization:
            raise forms.ValidationError(_(u"Can not create public users at this time. Please contact Magos support."))
        return self.cleaned_data

    def get_organization(self, special_code=None):
        organization = None
        if special_code:
            try:
                organization = Organization.objects.get(org_uuid=special_code)
            except Organization.DoesNotExist:
                # no organization matching special code exists
                pass
        # try to use general organization if no special code is set
        else:
            try:
                organization = Organization.objects.get(public_org=True)
            except Organization.DoesNotExist:
                # no public organization exists
                pass
        return organization

    def get_special_organization(self, special_code=None):
        organization = None
        if special_code:
            try:
                organization = Organization.objects.get(org_uuid=special_code)
            except Organization.DoesNotExist:
                # no organization matching special code exists
                pass
        return organization


    def get_public_organization(self):
        organization = None
        try:
            organization = Organization.objects.get(public_org=True)
        except Organization.DoesNotExist:
            # no public organization exists
            pass
        return organization


    def save(self, commit = True):
        user = super(UserRegistrationForm, self).save(commit = False)
        user.first_name = self.cleaned_data.get('first_name' or None)
        user.last_name = self.cleaned_data.get('last_name' or None)
        user.save()

        special_code = self.cleaned_data.get('special_code' or None)
        organization = self.get_organization(special_code)
        language = self.cleaned_data.get('language' or None)
        gender = self.cleaned_data.get('gender' or None)
        user_profile = user.get_profile()
        user_profile.organization = organization
        user_profile.language = language
        user_profile.gender = gender
        user_profile.save()
        return user

import csv

class BatchCreateUsersForm(forms.Form):
    file = forms.FileField()
    #place = forms.ModelChoiceField(queryset=Place.objects.all())

    def save(self):
        records = csv.reader(self.cleaned_data["file"])

        for line in records:
            user_data = User()
            print line
            """
            input_data = Data()
            input_data.place = self.cleaned_data["place"]
            input_data.time = datetime.strptime(line[1], "%m/%d/%y %H:%M:%S")
            input_data.data_1 = line[2]
            input_data.data_2 = line[3]
            input_data.data_3 = line[4]
            """
            #user_data.save()


class UserSettingsForm(AjaxBaseForm, forms.ModelForm):

    user = forms.CharField(required=True, widget=forms.HiddenInput())

    use_uppercase_text = forms.BooleanField(
        initial=False,
        required=False,
        label=_(u'use uppercase text')
    )

    class Meta:
        model=UserSettings
        exclude=('created', 'updated', )
