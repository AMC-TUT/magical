from django import forms
from django.contrib.auth.models import User
from apps.crystal.models import Description

class DescriptionForm(forms.ModelForm):
	author = forms.ModelChoiceField(queryset=User.objects.all(),
            widget=forms.HiddenInput())
	words = forms.CharField(widget=forms.HiddenInput())

	class Meta:
		model = Description
