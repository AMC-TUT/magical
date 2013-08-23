import subprocess
from django.template import Library

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
